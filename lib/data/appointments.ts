import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/domain";

const SHOP_TIME_ZONE = "America/Sao_Paulo";

type DatabaseAppointmentRow = {
  id: string;
  client_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: AppointmentStatus;
  notes: string | null;
};

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export type AppointmentBarberOption = {
  id: string;
  name: string;
  active: boolean;
};

export type AppointmentServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  priceInCents: number;
  active: boolean;
};

export type ManagedAppointment = {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceInCents: number;
  status: AppointmentStatus;
  notes: string | null;
  client: {
    name: string;
    phone: string;
    email: string | null;
  };
  barberName: string;
  serviceName: string;
};

export type AppointmentManagementData = {
  todayDate: string;
  appointments: ManagedAppointment[];
  barbers: AppointmentBarberOption[];
  services: AppointmentServiceOption[];
};

export type AppointmentManagementResult =
  | { status: "success"; data: AppointmentManagementData }
  | { status: "error" };

function getShopDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function toCents(price: number | string) {
  const parsed = Number(price);

  if (!Number.isFinite(parsed)) {
    throw new Error("Appointment price is invalid.");
  }

  return Math.round(parsed * 100);
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function getAppointmentManagementData(
  now = new Date(),
): Promise<AppointmentManagementResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const [appointmentsResult, barbersResult, servicesResult] = await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, client_id, barber_id, service_id, appointment_date, start_time, end_time, price, status, notes",
        )
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(100),
      supabase.from("barbers").select("id, name, active").order("name"),
      supabase
        .from("services")
        .select("id, name, duration_minutes, price, active")
        .order("name"),
    ]);

    if (appointmentsResult.error || barbersResult.error || servicesResult.error) {
      throw appointmentsResult.error ?? barbersResult.error ?? servicesResult.error;
    }

    const appointments = (appointmentsResult.data ?? []) as DatabaseAppointmentRow[];
    const clientsResult = appointments.length
      ? await supabase
          .from("clients")
          .select("id, name, phone, email")
          .in("id", [...new Set(appointments.map((item) => item.client_id))])
      : { data: [] as ClientRow[], error: null };

    if (clientsResult.error) {
      throw clientsResult.error;
    }

    const clients = new Map(
      ((clientsResult.data ?? []) as ClientRow[]).map((client) => [client.id, client]),
    );
    const barbers = (barbersResult.data ?? []) as AppointmentBarberOption[];
    const services = ((servicesResult.data ?? []) as Array<{
      id: string;
      name: string;
      duration_minutes: number;
      price: number | string;
      active: boolean;
    }>).map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.duration_minutes,
      priceInCents: toCents(service.price),
      active: service.active,
    }));
    const barberNames = new Map(barbers.map((barber) => [barber.id, barber.name]));
    const serviceNames = new Map(
      services.map((service) => [service.id, service.name]),
    );

    return {
      status: "success",
      data: {
        todayDate: getShopDate(now),
        barbers,
        services,
        appointments: appointments.map((appointment) => {
          const client = clients.get(appointment.client_id);

          return {
            id: appointment.id,
            clientId: appointment.client_id,
            barberId: appointment.barber_id,
            serviceId: appointment.service_id,
            date: appointment.appointment_date,
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            durationMinutes: Math.max(
              0,
              timeToMinutes(appointment.end_time) -
                timeToMinutes(appointment.start_time),
            ),
            priceInCents: toCents(appointment.price),
            status: appointment.status,
            notes: appointment.notes,
            client: {
              name: client?.name ?? "Cliente não identificado",
              phone: client?.phone ?? "Não disponível",
              email: client?.email ?? null,
            },
            barberName:
              barberNames.get(appointment.barber_id) ??
              "Profissional não identificado",
            serviceName:
              serviceNames.get(appointment.service_id) ??
              "Serviço não identificado",
          };
        }),
      },
    };
  } catch (error) {
    console.error(
      "[admin-appointments] Unable to load appointment management data.",
      error instanceof Error ? error.message : "Unknown data error.",
    );
    return { status: "error" };
  }
}
