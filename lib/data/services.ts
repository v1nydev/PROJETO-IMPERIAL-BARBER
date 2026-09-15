import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type DatabaseServiceRow = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ManagedService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceInCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceManagementResult =
  | { status: "success"; services: ManagedService[] }
  | { status: "error" };

function toCents(price: number | string) {
  const parsed = Number(price);

  if (!Number.isFinite(parsed)) {
    throw new Error("Service price is invalid.");
  }

  return Math.round(parsed * 100);
}

export async function getServiceManagementData(): Promise<ServiceManagementResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, description, duration_minutes, price, active, created_at, updated_at",
      )
      .order("active", { ascending: false })
      .order("name");

    if (error) {
      throw error;
    }

    return {
      status: "success",
      services: ((data ?? []) as DatabaseServiceRow[]).map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        durationMinutes: service.duration_minutes,
        priceInCents: toCents(service.price),
        active: service.active,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
      })),
    };
  } catch (error) {
    console.error(
      "[admin-services] Unable to load services.",
      error instanceof Error ? error.message : "Unknown data error.",
    );
    return { status: "error" };
  }
}
