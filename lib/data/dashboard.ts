import "server-only";

import type { AppointmentStatus } from "@/types/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SHOP_TIME_ZONE = "America/Sao_Paulo";
const ACTIVE_REVENUE_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];
const UPCOMING_STATUSES: AppointmentStatus[] = ["pending", "confirmed"];

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
};

type NamedRow = {
  id: string;
  name: string;
};

export type DashboardAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  priceInCents: number;
  status: AppointmentStatus;
  clientName: string;
  serviceName: string;
  barberName: string;
};

export type DashboardData = {
  date: string;
  today: {
    expectedRevenueInCents: number;
    realizedRevenueInCents: number;
    appointmentCount: number;
    completedCount: number;
    cancellationCount: number;
  };
  month: {
    averageTicketInCents: number;
    topService: { name: string; count: number } | null;
    topBarber: { name: string; count: number } | null;
    cancellationRate: number;
  };
  upcomingAppointments: DashboardAppointment[];
};

export type DashboardResult =
  | { status: "success"; data: DashboardData }
  | { status: "error" };

function getShopClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
  };
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function getMonthBounds(date: string) {
  const [year, month] = date.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  return { monthStart, monthEnd };
}

function toCents(price: number | string) {
  const parsed = Number(price);

  if (!Number.isFinite(parsed)) {
    throw new Error("Appointment price is invalid.");
  }

  return Math.round(parsed * 100);
}

function rankByName(
  appointments: DashboardAppointment[],
  selector: (appointment: DashboardAppointment) => string,
) {
  const counts = new Map<string, number>();

  appointments.forEach((appointment) => {
    const name = selector(appointment);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const ranked = [...counts.entries()].sort(
    ([nameA, countA], [nameB, countB]) =>
      countB - countA || nameA.localeCompare(nameB, "pt-BR"),
  );

  return ranked[0] ? { name: ranked[0][0], count: ranked[0][1] } : null;
}

export async function getDashboardData(now = new Date()): Promise<DashboardResult> {
  try {
    const shopClock = getShopClock(now);
    const { monthStart, monthEnd } = getMonthBounds(shopClock.date);
    const upcomingEnd = addDays(shopClock.date, 30);
    const rangeEnd = monthEnd > upcomingEnd ? monthEnd : upcomingEnd;
    const supabase = await createSupabaseServerClient();
    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        "id, client_id, barber_id, service_id, appointment_date, start_time, end_time, price, status",
      )
      .gte("appointment_date", monthStart)
      .lte("appointment_date", rangeEnd)
      .order("appointment_date")
      .order("start_time");

    if (appointmentError) {
      throw appointmentError;
    }

    const appointments = (appointmentData ?? []) as DatabaseAppointmentRow[];
    const clientIds = [...new Set(appointments.map((item) => item.client_id))];
    const serviceIds = [...new Set(appointments.map((item) => item.service_id))];
    const barberIds = [...new Set(appointments.map((item) => item.barber_id))];

    const [clientsResult, servicesResult, barbersResult] = await Promise.all([
      clientIds.length
        ? supabase.from("clients").select("id, name").in("id", clientIds)
        : Promise.resolve({ data: [] as NamedRow[], error: null }),
      serviceIds.length
        ? supabase.from("services").select("id, name").in("id", serviceIds)
        : Promise.resolve({ data: [] as NamedRow[], error: null }),
      barberIds.length
        ? supabase.from("barbers").select("id, name").in("id", barberIds)
        : Promise.resolve({ data: [] as NamedRow[], error: null }),
    ]);

    if (clientsResult.error || servicesResult.error || barbersResult.error) {
      throw clientsResult.error ?? servicesResult.error ?? barbersResult.error;
    }

    const clients = new Map(
      ((clientsResult.data ?? []) as NamedRow[]).map((item) => [item.id, item.name]),
    );
    const services = new Map(
      ((servicesResult.data ?? []) as NamedRow[]).map((item) => [item.id, item.name]),
    );
    const barbers = new Map(
      ((barbersResult.data ?? []) as NamedRow[]).map((item) => [item.id, item.name]),
    );

    const enriched: DashboardAppointment[] = appointments.map((appointment) => ({
      id: appointment.id,
      date: appointment.appointment_date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      priceInCents: toCents(appointment.price),
      status: appointment.status,
      clientName: clients.get(appointment.client_id) ?? "Cliente não identificado",
      serviceName: services.get(appointment.service_id) ?? "Serviço não identificado",
      barberName: barbers.get(appointment.barber_id) ?? "Profissional não identificado",
    }));

    const todayAppointments = enriched.filter(
      (appointment) => appointment.date === shopClock.date,
    );
    const monthAppointments = enriched.filter(
      (appointment) =>
        appointment.date >= monthStart && appointment.date <= monthEnd,
    );
    const operationalMonthAppointments = monthAppointments.filter(
      (appointment) =>
        appointment.status !== "cancelled" && appointment.status !== "no_show",
    );
    const completedMonthAppointments = monthAppointments.filter(
      (appointment) => appointment.status === "completed",
    );
    const completedMonthRevenue = completedMonthAppointments.reduce(
      (total, appointment) => total + appointment.priceInCents,
      0,
    );
    const monthCancellationCount = monthAppointments.filter(
      (appointment) => appointment.status === "cancelled",
    ).length;

    const upcomingAppointments = enriched
      .filter(
        (appointment) =>
          UPCOMING_STATUSES.includes(appointment.status) &&
          (appointment.date > shopClock.date ||
            (appointment.date === shopClock.date &&
              appointment.startTime >= shopClock.time)),
      )
      .slice(0, 5);

    return {
      status: "success",
      data: {
        date: shopClock.date,
        today: {
          expectedRevenueInCents: todayAppointments
            .filter((appointment) =>
              ACTIVE_REVENUE_STATUSES.includes(appointment.status),
            )
            .reduce((total, appointment) => total + appointment.priceInCents, 0),
          realizedRevenueInCents: todayAppointments
            .filter((appointment) => appointment.status === "completed")
            .reduce((total, appointment) => total + appointment.priceInCents, 0),
          appointmentCount: todayAppointments.length,
          completedCount: todayAppointments.filter(
            (appointment) => appointment.status === "completed",
          ).length,
          cancellationCount: todayAppointments.filter(
            (appointment) => appointment.status === "cancelled",
          ).length,
        },
        month: {
          averageTicketInCents: completedMonthAppointments.length
            ? Math.round(completedMonthRevenue / completedMonthAppointments.length)
            : 0,
          topService: rankByName(
            operationalMonthAppointments,
            (appointment) => appointment.serviceName,
          ),
          topBarber: rankByName(
            operationalMonthAppointments,
            (appointment) => appointment.barberName,
          ),
          cancellationRate: monthAppointments.length
            ? (monthCancellationCount / monthAppointments.length) * 100
            : 0,
        },
        upcomingAppointments,
      },
    };
  } catch (error) {
    console.error(
      "[admin-dashboard] Unable to load dashboard data.",
      error instanceof Error ? error.message : "Unknown data error.",
    );
    return { status: "error" };
  }
}
