"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdministrativeAccess } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const serviceFieldsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0).max(99_999_999.99),
});

const updateServiceSchema = serviceFieldsSchema.extend({
  serviceId: z.string().regex(UUID_PATTERN),
});

const toggleServiceSchema = z.object({
  serviceId: z.string().regex(UUID_PATTERN),
  nextActive: z.enum(["true", "false"]),
});

export type ServiceActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialServiceActionState: ServiceActionState = {
  status: "idle",
  message: null,
};

async function getAuthorizedAdmin() {
  const supabase = await createSupabaseServerClient();
  const access = await getAdministrativeAccess(supabase);

  if (access.status !== "authorized" || access.actor.role !== "admin") {
    return null;
  }

  return supabase;
}

function parseServiceFields(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
  };
}

function revalidateServiceViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/servicos");
}

export async function createServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const parsed = serviceFieldsSchema.safeParse(parseServiceFields(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise nome, duração e preço antes de salvar.",
    };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para criar serviços.",
    };
  }

  const { error } = await supabase.from("services").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    duration_minutes: parsed.data.durationMinutes,
    price: parsed.data.price.toFixed(2),
    active: true,
  });

  if (error) {
    console.error("[admin-services] Unable to create service.", error.message);
    return {
      status: "error",
      message: "Não foi possível criar o serviço. Tente novamente.",
    };
  }

  revalidateServiceViews();
  return { status: "success", message: "Serviço criado e ativado." };
}

export async function updateServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const parsed = updateServiceSchema.safeParse({
    serviceId: formData.get("serviceId"),
    ...parseServiceFields(formData),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise nome, descrição, duração e preço.",
    };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para editar serviços.",
    };
  }

  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      duration_minutes: parsed.data.durationMinutes,
      price: parsed.data.price.toFixed(2),
    })
    .eq("id", parsed.data.serviceId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(
      "[admin-services] Unable to update service.",
      error?.message ?? "Service not found.",
    );
    return {
      status: "error",
      message: "Não foi possível salvar as alterações.",
    };
  }

  revalidateServiceViews();
  return { status: "success", message: "Serviço atualizado com sucesso." };
}

export async function toggleServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const parsed = toggleServiceSchema.safeParse({
    serviceId: formData.get("serviceId"),
    nextActive: formData.get("nextActive"),
  });

  if (!parsed.success) {
    return { status: "error", message: "A ação solicitada é inválida." };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para alterar serviços.",
    };
  }

  const nextActive = parsed.data.nextActive === "true";
  const { data, error } = await supabase
    .from("services")
    .update({ active: nextActive })
    .eq("id", parsed.data.serviceId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(
      "[admin-services] Unable to toggle service.",
      error?.message ?? "Service not found.",
    );
    return {
      status: "error",
      message: "Não foi possível alterar a disponibilidade do serviço.",
    };
  }

  revalidateServiceViews();
  return {
    status: "success",
    message: nextActive
      ? "Serviço ativado para novos agendamentos."
      : "Serviço desativado e preservado no histórico.",
  };
}
