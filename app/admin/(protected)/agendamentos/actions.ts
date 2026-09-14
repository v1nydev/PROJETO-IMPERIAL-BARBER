"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdministrativeAccess } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/types/domain";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];

const statusActionSchema = z.object({
  appointmentId: z.string().regex(UUID_PATTERN),
  nextStatus: z.enum(["confirmed", "in_progress", "completed", "cancelled"]),
});

const updateAppointmentSchema = z.object({
  appointmentId: z.string().regex(UUID_PATTERN),
  appointmentDate: z.string().regex(DATE_PATTERN),
  startTime: z.string().regex(TIME_PATTERN),
  barberId: z.string().regex(UUID_PATTERN),
  serviceId: z.string().regex(UUID_PATTERN),
  notes: z.string().trim().max(1000),
});

export type AppointmentActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialAppointmentActionState: AppointmentActionState = {
  status: "idle",
  message: null,
};

const allowedStatusTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const statusSuccessMessages: Partial<Record<AppointmentStatus, string>> = {
  confirmed: "Agendamento confirmado.",
  in_progress: "Atendimento iniciado.",
  completed: "Atendimento concluído.",
  cancelled: "Agendamento cancelado e mantido no histórico.",
};

async function getAuthorizedAdmin() {
  const supabase = await createSupabaseServerClient();
  const access = await getAdministrativeAccess(supabase);

  if (access.status !== "authorized" || access.actor.role !== "admin") {
    return null;
  }

  return supabase;
}

function revalidateAppointmentViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agendamentos");
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function intervalsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export async function updateAppointmentStatusAction(
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const parsed = statusActionSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    return { status: "error", message: "A ação solicitada é inválida." };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para alterar agendamentos.",
    };
  }

  const { data: appointment, error: lookupError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", parsed.data.appointmentId)
    .maybeSingle();

  if (lookupError || !appointment) {
    return { status: "error", message: "Agendamento não encontrado." };
  }

  const currentStatus = appointment.status as AppointmentStatus;

  if (!allowedStatusTransitions[currentStatus].includes(parsed.data.nextStatus)) {
    return {
      status: "error",
      message: "O status do agendamento mudou. Atualize a página e tente novamente.",
    };
  }

  const { data: updatedAppointment, error: updateError } = await supabase
    .from("appointments")
    .update({ status: parsed.data.nextStatus })
    .eq("id", parsed.data.appointmentId)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedAppointment) {
    console.error(
      "[admin-appointments] Unable to update appointment status.",
      updateError?.message ?? "Appointment changed concurrently.",
    );
    return {
      status: "error",
      message: "Não foi possível atualizar o status. Tente novamente.",
    };
  }

  revalidateAppointmentViews();

  return {
    status: "success",
    message: statusSuccessMessages[parsed.data.nextStatus] ?? "Status atualizado.",
  };
}

export async function updateAppointmentAction(
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const parsed = updateAppointmentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    appointmentDate: formData.get("appointmentDate"),
    startTime: formData.get("startTime"),
    barberId: formData.get("barberId"),
    serviceId: formData.get("serviceId"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise a data, o horário e os campos informados.",
    };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para alterar agendamentos.",
    };
  }

  const { data: currentAppointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", parsed.data.appointmentId)
    .maybeSingle();

  if (appointmentError || !currentAppointment) {
    return { status: "error", message: "Agendamento não encontrado." };
  }

  if (!ACTIVE_APPOINTMENT_STATUSES.includes(currentAppointment.status)) {
    return {
      status: "error",
      message: "Agendamentos finalizados não podem ser remarcados.",
    };
  }

  const [serviceResult, barberResult] = await Promise.all([
    supabase
      .from("services")
      .select("duration_minutes, active")
      .eq("id", parsed.data.serviceId)
      .maybeSingle(),
    supabase
      .from("barbers")
      .select("active")
      .eq("id", parsed.data.barberId)
      .maybeSingle(),
  ]);

  if (serviceResult.error || !serviceResult.data?.active) {
    return { status: "error", message: "Selecione um serviço ativo." };
  }

  if (barberResult.error || !barberResult.data?.active) {
    return { status: "error", message: "Selecione um profissional ativo." };
  }

  const startMinutes = timeToMinutes(parsed.data.startTime);
  const endMinutes = startMinutes + serviceResult.data.duration_minutes;

  if (endMinutes > 24 * 60) {
    return {
      status: "error",
      message: "O atendimento ultrapassa o fim do dia. Escolha outro horário.",
    };
  }

  const endTime = minutesToTime(endMinutes);
  const dayOfWeek = new Date(
    `${parsed.data.appointmentDate}T12:00:00Z`,
  ).getUTCDay();
  const [availabilityResult, exceptionsResult, conflictsResult] =
    await Promise.all([
      supabase
        .from("barber_availability")
        .select("start_time, end_time")
        .eq("barber_id", parsed.data.barberId)
        .eq("day_of_week", dayOfWeek)
        .eq("active", true),
      supabase
        .from("barber_availability_exceptions")
        .select("start_time, end_time")
        .eq("exception_date", parsed.data.appointmentDate)
        .eq("active", true)
        .or(`barber_id.is.null,barber_id.eq.${parsed.data.barberId}`),
      supabase
        .from("appointments")
        .select("id")
        .eq("barber_id", parsed.data.barberId)
        .eq("appointment_date", parsed.data.appointmentDate)
        .neq("id", parsed.data.appointmentId)
        .in("status", ACTIVE_APPOINTMENT_STATUSES)
        .lt("start_time", endTime)
        .gt("end_time", parsed.data.startTime)
        .limit(1),
    ]);

  if (availabilityResult.error || exceptionsResult.error || conflictsResult.error) {
    console.error(
      "[admin-appointments] Unable to validate appointment availability.",
      availabilityResult.error?.message ??
        exceptionsResult.error?.message ??
        conflictsResult.error?.message,
    );
    return {
      status: "error",
      message: "Não foi possível validar a disponibilidade. Tente novamente.",
    };
  }

  const fitsWorkingHours = (availabilityResult.data ?? []).some(
    (window) =>
      window.start_time.slice(0, 5) <= parsed.data.startTime &&
      window.end_time.slice(0, 5) >= endTime,
  );

  if (!fitsWorkingHours) {
    return {
      status: "error",
      message: "O profissional não está disponível nesse período.",
    };
  }

  const hitsException = (exceptionsResult.data ?? []).some((exception) => {
    if (!exception.start_time || !exception.end_time) {
      return true;
    }

    return intervalsOverlap(
      parsed.data.startTime,
      endTime,
      exception.start_time.slice(0, 5),
      exception.end_time.slice(0, 5),
    );
  });

  if (hitsException) {
    return {
      status: "error",
      message: "Existe um bloqueio de disponibilidade nesse período.",
    };
  }

  if ((conflictsResult.data ?? []).length) {
    return {
      status: "error",
      message: "Esse profissional já possui um atendimento nesse horário.",
    };
  }

  const { data: updatedAppointment, error: updateError } = await supabase
    .from("appointments")
    .update({
      appointment_date: parsed.data.appointmentDate,
      start_time: parsed.data.startTime,
      barber_id: parsed.data.barberId,
      service_id: parsed.data.serviceId,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.appointmentId)
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedAppointment) {
    console.error(
      "[admin-appointments] Unable to update appointment.",
      updateError?.message ?? "Appointment changed concurrently.",
    );
    return {
      status: "error",
      message:
        updateError?.code === "23P01"
          ? "O horário acabou de ser ocupado. Escolha outro período."
          : "Não foi possível salvar as alterações. Tente novamente.",
    };
  }

  revalidateAppointmentViews();

  return {
    status: "success",
    message: "Agendamento atualizado com sucesso.",
  };
}
