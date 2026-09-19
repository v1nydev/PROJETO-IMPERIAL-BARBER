import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const requestSchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type SlotRow = { start_time: string };

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Serviço, profissional ou data inválidos." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("get_public_booking_slots", {
      p_service_id: parsed.data.serviceId,
      p_barber_id: parsed.data.barberId,
      p_appointment_date: parsed.data.date,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      slots: ((data ?? []) as SlotRow[]).map((slot) => slot.start_time.slice(0, 5)),
    });
  } catch (error) {
    console.error(
      "[public-availability] Unable to load booking slots.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { message: "Não foi possível consultar os horários. Tente novamente." },
      { status: 503 },
    );
  }
}

