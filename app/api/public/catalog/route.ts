import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { PublicCatalog } from "@/types/public-booking";

export const dynamic = "force-dynamic";

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number | string;
};

type BarberRow = {
  id: string;
  name: string;
  specialty: string;
  avatar_url: string | null;
};

type SettingsRow = {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  opening_hours: string;
  description: string;
};

export async function GET() {
  try {
    const supabase = createSupabasePublicClient();
    const [servicesResult, barbersResult, settingsResult] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, description, duration_minutes, price")
        .eq("active", true)
        .order("name"),
      supabase
        .from("barbers")
        .select("id, name, specialty, avatar_url")
        .eq("active", true)
        .order("name"),
      supabase
        .from("shop_settings")
        .select("name, phone, whatsapp, address, opening_hours, description")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (servicesResult.error || barbersResult.error || settingsResult.error) {
      throw servicesResult.error ?? barbersResult.error ?? settingsResult.error;
    }

    const settings = settingsResult.data as SettingsRow | null;
    const catalog: PublicCatalog = {
      services: ((servicesResult.data ?? []) as ServiceRow[]).map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        durationMinutes: service.duration_minutes,
        price: Number(service.price),
      })),
      barbers: ((barbersResult.data ?? []) as BarberRow[]).map((barber) => ({
        id: barber.id,
        name: barber.name,
        specialty: barber.specialty,
        avatarUrl: barber.avatar_url,
      })),
      settings: settings
        ? {
            name: settings.name,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            address: settings.address,
            openingHours: settings.opening_hours,
            description: settings.description,
          }
        : null,
    };

    return NextResponse.json(catalog, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "[public-catalog] Unable to load public catalog.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { message: "Não foi possível atualizar o catálogo agora." },
      { status: 503 },
    );
  }
}

