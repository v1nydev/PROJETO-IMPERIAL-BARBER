import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type DatabaseShopSettingsRow = {
  id: number;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  opening_hours: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ShopSettings = {
  id: number;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  openingHours: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ShopSettingsResult =
  | { status: "success"; settings: ShopSettings }
  | { status: "error" };

export async function getShopSettings(): Promise<ShopSettingsResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("shop_settings")
      .select(
        "id, name, phone, whatsapp, address, opening_hours, description, created_at, updated_at",
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      throw error ?? new Error("Shop settings were not found.");
    }

    const row = data as DatabaseShopSettingsRow;

    return {
      status: "success",
      settings: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        address: row.address,
        openingHours: row.opening_hours,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    };
  } catch (error) {
    console.error(
      "[admin-settings] Unable to load shop settings.",
      error instanceof Error ? error.message : error,
    );
    return { status: "error" };
  }
}
