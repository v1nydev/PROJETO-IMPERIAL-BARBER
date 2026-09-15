"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdministrativeAccess } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
  whatsapp: z.string().trim().min(8).max(40),
  address: z.string().trim().min(5).max(500),
  openingHours: z.string().trim().min(5).max(500),
  description: z.string().trim().max(1000),
});

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
  message: null,
};

function parseSettingsFields(formData: FormData) {
  return {
    name: formData.get("name"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
    openingHours: formData.get("openingHours"),
    description: formData.get("description") ?? "",
  };
}

export async function updateShopSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = settingsSchema.safeParse(parseSettingsFields(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados de contato, endereço e funcionamento.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const access = await getAdministrativeAccess(supabase);

  if (access.status !== "authorized" || access.actor.role !== "admin") {
    return {
      status: "error",
      message: "Sua conta não possui permissão para alterar as configurações.",
    };
  }

  const { data, error } = await supabase
    .from("shop_settings")
    .upsert(
      {
        id: 1,
        name: parsed.data.name,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp,
        address: parsed.data.address,
        opening_hours: parsed.data.openingHours,
        description: parsed.data.description,
      },
      { onConflict: "id" },
    )
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error(
      "[admin-settings] Unable to update shop settings.",
      error?.message ?? "Settings were not saved.",
    );
    return {
      status: "error",
      message: "Não foi possível salvar as configurações. Tente novamente.",
    };
  }

  revalidatePath("/admin/configuracoes");
  return { status: "success", message: "Configurações salvas com sucesso." };
}
