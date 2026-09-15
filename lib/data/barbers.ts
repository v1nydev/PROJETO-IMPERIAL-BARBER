import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type DatabaseBarberRow = {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  specialty: string;
  bio: string;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type AvailabilityRow = {
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type AppointmentReferenceRow = {
  barber_id: string;
  status: string;
};

const OPEN_APPOINTMENT_STATUSES = new Set([
  "pending",
  "confirmed",
  "in_progress",
]);

export type BarberAvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type ManagedBarber = {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  specialty: string;
  bio: string;
  avatarUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  availability: BarberAvailabilityWindow[];
  appointmentCount: number;
  openAppointmentCount: number;
};

export type BarberManagementResult =
  | { status: "success"; barbers: ManagedBarber[] }
  | { status: "error" };

export async function getBarberManagementData(): Promise<BarberManagementResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const [barbersResult, availabilityResult, appointmentsResult] =
      await Promise.all([
        supabase
          .from("barbers")
          .select(
            "id, user_id, name, slug, specialty, bio, avatar_url, active, created_at, updated_at",
          )
          .order("active", { ascending: false })
          .order("name"),
        supabase
          .from("barber_availability")
          .select("barber_id, day_of_week, start_time, end_time")
          .eq("active", true)
          .order("day_of_week")
          .order("start_time"),
        supabase.from("appointments").select("barber_id, status"),
      ]);

    if (barbersResult.error || availabilityResult.error || appointmentsResult.error) {
      throw (
        barbersResult.error ?? availabilityResult.error ?? appointmentsResult.error
      );
    }

    const availabilityByBarber = new Map<string, BarberAvailabilityWindow[]>();
    ((availabilityResult.data ?? []) as AvailabilityRow[]).forEach((window) => {
      const current = availabilityByBarber.get(window.barber_id) ?? [];
      current.push({
        dayOfWeek: window.day_of_week,
        startTime: window.start_time,
        endTime: window.end_time,
      });
      availabilityByBarber.set(window.barber_id, current);
    });

    const appointmentCounts = new Map<string, number>();
    const openAppointmentCounts = new Map<string, number>();
    ((appointmentsResult.data ?? []) as AppointmentReferenceRow[]).forEach(
      (appointment) => {
        appointmentCounts.set(
          appointment.barber_id,
          (appointmentCounts.get(appointment.barber_id) ?? 0) + 1,
        );

        if (OPEN_APPOINTMENT_STATUSES.has(appointment.status)) {
          openAppointmentCounts.set(
            appointment.barber_id,
            (openAppointmentCounts.get(appointment.barber_id) ?? 0) + 1,
          );
        }
      },
    );

    return {
      status: "success",
      barbers: ((barbersResult.data ?? []) as DatabaseBarberRow[]).map(
        (barber) => ({
          id: barber.id,
          userId: barber.user_id,
          name: barber.name,
          slug: barber.slug,
          specialty: barber.specialty,
          bio: barber.bio,
          avatarUrl: barber.avatar_url,
          active: barber.active,
          createdAt: barber.created_at,
          updatedAt: barber.updated_at,
          availability: availabilityByBarber.get(barber.id) ?? [],
          appointmentCount: appointmentCounts.get(barber.id) ?? 0,
          openAppointmentCount: openAppointmentCounts.get(barber.id) ?? 0,
        }),
      ),
    };
  } catch (error) {
    console.error(
      "[admin-barbers] Unable to load professionals.",
      error instanceof Error ? error.message : error,
    );
    return { status: "error" };
  }
}
