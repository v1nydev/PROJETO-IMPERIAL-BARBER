import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/domain";

const SHOP_TIME_ZONE = "America/Sao_Paulo";
const UPCOMING_DAY_COUNT = 7;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const appointmentStatuses: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

export type AgendaView = "today" | "upcoming";

export type AgendaFilters = {
  view: AgendaView;
  barberId: string | null;
  status: AppointmentStatus | null;
  date: string | null;
};

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

type BarberRow = NamedRow & {
  active: boolean;
};

export type AgendaAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceInCents: number;
  status: AppointmentStatus;
  clientName: string;
  serviceName: string;
  barberName: string;
};

export type AgendaData = {
  todayDate: string;
  rangeStart: string;
  rangeEnd: string;
  appointments: AgendaAppointment[];
  barbers: BarberRow[];
};

export type AgendaResult =
  | { status: "success"; data: AgendaData }
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

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function isValidDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function normalizeAgendaFilters(input: {
  view?: string;
  barber?: string;
  status?: string;
  date?: string;
}): AgendaFilters {
  return {
    view: input.view === "upcoming" ? "upcoming" : "today",
    barberId:
      input.barber && UUID_PATTERN.test(input.barber) ? input.barber : null,
    status: appointmentStatuses.includes(input.status as AppointmentStatus)
      ? (input.status as AppointmentStatus)
      : null,
    date: isValidDate(input.date) ? input.date : null,
  };
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

function getDurationMinutes(startTime: string, endTime: string) {
  return Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));
}

export async function getAgendaData(
  filters: AgendaFilters,
  now = new Date(),
): Promise<AgendaResult> {
  try {
    const todayDate = getShopDate(now);
    const rangeStart = filters.date
      ? filters.date
      : filters.view === "upcoming"
        ? addDays(todayDate, 1)
        : todayDate;
    const rangeEnd = filters.date
      ? filters.date
      : filters.view === "upcoming"
        ? addDays(todayDate, UPCOMING_DAY_COUNT)
        : todayDate;
    const supabase = await createSupabaseServerClient();

    let appointmentQuery = supabase
      .from("appointments")
      .select(
        "id, client_id, barber_id, service_id, appointment_date, start_time, end_time, price, status",
      )
      .gte("appointment_date", rangeStart)
      .lte("appointment_date", rangeEnd)
      .order("appointment_date")
      .order("start_time");

    if (filters.barberId) {
      appointmentQuery = appointmentQuery.eq("barber_id", filters.barberId);
    }

    if (filters.status) {
      appointmentQuery = appointmentQuery.eq("status", filters.status);
    }

    const [appointmentResult, barberResult] = await Promise.all([
      appointmentQuery,
      supabase.from("barbers").select("id, name, active").order("name"),
    ]);

    if (appointmentResult.error || barberResult.error) {
      throw appointmentResult.error ?? barberResult.error;
    }

    const appointments = (appointmentResult.data ?? []) as DatabaseAppointmentRow[];
    const barbers = (barberResult.data ?? []) as BarberRow[];
    const clientIds = [...new Set(appointments.map((item) => item.client_id))];
    const serviceIds = [...new Set(appointments.map((item) => item.service_id))];

    const [clientsResult, servicesResult] = await Promise.all([
      clientIds.length
        ? supabase.from("clients").select("id, name").in("id", clientIds)
        : Promise.resolve({ data: [] as NamedRow[], error: null }),
      serviceIds.length
        ? supabase.from("services").select("id, name").in("id", serviceIds)
        : Promise.resolve({ data: [] as NamedRow[], error: null }),
    ]);

    if (clientsResult.error || servicesResult.error) {
      throw clientsResult.error ?? servicesResult.error;
    }

    const clients = new Map(
      ((clientsResult.data ?? []) as NamedRow[]).map((item) => [item.id, item.name]),
    );
    const services = new Map(
      ((servicesResult.data ?? []) as NamedRow[]).map((item) => [item.id, item.name]),
    );
    const barberNames = new Map(barbers.map((item) => [item.id, item.name]));

    return {
      status: "success",
      data: {
        todayDate,
        rangeStart,
        rangeEnd,
        barbers,
        appointments: appointments.map((appointment) => ({
          id: appointment.id,
          date: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          durationMinutes: getDurationMinutes(
            appointment.start_time,
            appointment.end_time,
          ),
          priceInCents: toCents(appointment.price),
          status: appointment.status,
          clientName: clients.get(appointment.client_id) ?? "Cliente não identificado",
          serviceName:
            services.get(appointment.service_id) ?? "Serviço não identificado",
          barberName:
            barberNames.get(appointment.barber_id) ?? "Profissional não identificado",
        })),
      },
    };
  } catch (error) {
    console.error(
      "[admin-agenda] Unable to load schedule data.",
      error instanceof Error ? error.message : "Unknown data error.",
    );
    return { status: "error" };
  }
}
