"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdministrativeAccess } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const avatarUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });

const barberFieldsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  specialty: z.string().trim().min(2).max(160),
  bio: z.string().trim().max(1000),
  avatarUrl: avatarUrlSchema,
});

const updateBarberSchema = barberFieldsSchema.extend({
  barberId: z.string().regex(UUID_PATTERN),
});

const toggleBarberSchema = z.object({
  barberId: z.string().regex(UUID_PATTERN),
  nextActive: z.enum(["true", "false"]),
});

export type BarberActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialBarberActionState: BarberActionState = {
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

function parseBarberFields(formData: FormData) {
  return {
    name: formData.get("name"),
    specialty: formData.get("specialty"),
    bio: formData.get("bio") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
  };
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "profissional"
  );
}

async function getAvailableSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  name: string,
  excludedBarberId?: string,
) {
  const baseSlug = slugify(name);
  let query = supabase
    .from("barbers")
    .select("id, slug")
    .like("slug", `${baseSlug}%`);

  if (excludedBarberId) {
    query = query.neq("id", excludedBarberId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const usedSlugs = new Set((data ?? []).map((barber) => barber.slug));
  if (!usedSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

function revalidateBarberViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/profissionais");
}

export async function createBarberAction(
  _previousState: BarberActionState,
  formData: FormData,
): Promise<BarberActionState> {
  const parsed = barberFieldsSchema.safeParse(parseBarberFields(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise nome, especialidade, biografia e endereço da foto.",
    };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para cadastrar profissionais.",
    };
  }

  try {
    const slug = await getAvailableSlug(supabase, parsed.data.name);
    const { error } = await supabase.from("barbers").insert({
      name: parsed.data.name,
      slug,
      specialty: parsed.data.specialty,
      bio: parsed.data.bio,
      avatar_url: parsed.data.avatarUrl || null,
      active: true,
    });

    if (error) throw error;
  } catch (error) {
    console.error(
      "[admin-barbers] Unable to create professional.",
      error instanceof Error ? error.message : "Unknown mutation error.",
    );
    return {
      status: "error",
      message: "Não foi possível cadastrar o profissional. Tente novamente.",
    };
  }

  revalidateBarberViews();
  return { status: "success", message: "Profissional cadastrado e ativado." };
}

export async function updateBarberAction(
  _previousState: BarberActionState,
  formData: FormData,
): Promise<BarberActionState> {
  const parsed = updateBarberSchema.safeParse({
    barberId: formData.get("barberId"),
    ...parseBarberFields(formData),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise nome, especialidade, biografia e endereço da foto.",
    };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para editar profissionais.",
    };
  }

  try {
    const slug = await getAvailableSlug(
      supabase,
      parsed.data.name,
      parsed.data.barberId,
    );
    const { data, error } = await supabase
      .from("barbers")
      .update({
        name: parsed.data.name,
        slug,
        specialty: parsed.data.specialty,
        bio: parsed.data.bio,
        avatar_url: parsed.data.avatarUrl || null,
      })
      .eq("id", parsed.data.barberId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      throw error ?? new Error("Professional not found.");
    }
  } catch (error) {
    console.error(
      "[admin-barbers] Unable to update professional.",
      error instanceof Error ? error.message : "Unknown mutation error.",
    );
    return {
      status: "error",
      message: "Não foi possível salvar as alterações.",
    };
  }

  revalidateBarberViews();
  return { status: "success", message: "Profissional atualizado com sucesso." };
}

export async function toggleBarberAction(
  _previousState: BarberActionState,
  formData: FormData,
): Promise<BarberActionState> {
  const parsed = toggleBarberSchema.safeParse({
    barberId: formData.get("barberId"),
    nextActive: formData.get("nextActive"),
  });

  if (!parsed.success) {
    return { status: "error", message: "A ação solicitada é inválida." };
  }

  const supabase = await getAuthorizedAdmin();

  if (!supabase) {
    return {
      status: "error",
      message: "Sua conta não possui permissão para alterar profissionais.",
    };
  }

  const nextActive = parsed.data.nextActive === "true";
  const { data, error } = await supabase
    .from("barbers")
    .update({ active: nextActive })
    .eq("id", parsed.data.barberId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(
      "[admin-barbers] Unable to toggle professional.",
      error?.message ?? "Professional not found.",
    );
    return {
      status: "error",
      message: "Não foi possível alterar a disponibilidade do profissional.",
    };
  }

  revalidateBarberViews();
  return {
    status: "success",
    message: nextActive
      ? "Profissional ativado para novos agendamentos."
      : "Profissional desativado e preservado no histórico.",
  };
}
