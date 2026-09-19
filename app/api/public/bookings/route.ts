import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  clientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]),
  website: z.string().max(0).optional().default(""),
});

type BookingRow = { appointment_id: string };

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise seus dados e tente novamente." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("create_public_booking", {
      p_service_id: parsed.data.serviceId,
      p_barber_id: parsed.data.barberId,
      p_appointment_date: parsed.data.date,
      p_start_time: parsed.data.time,
      p_client_name: parsed.data.clientName,
      p_phone: parsed.data.phone,
      p_email: parsed.data.email || null,
    });

    if (error) {
      const unavailable = error.code === "P0001" || error.code === "23P01";
      console.error("[public-booking] Unable to create booking.", error.message);
      return NextResponse.json(
        {
          message: unavailable
            ? "Esse horário não está mais disponível. Escolha outro horário."
            : "Não foi possível concluir a reserva. Tente novamente.",
        },
        { status: unavailable ? 409 : 503 },
      );
    }

    const booking = ((data ?? []) as BookingRow[])[0];
    if (!booking) {
      throw new Error("Booking RPC returned no appointment.");
    }

    return NextResponse.json(
      { appointmentId: booking.appointment_id },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "[public-booking] Unexpected booking failure.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { message: "Não foi possível concluir a reserva. Tente novamente." },
      { status: 503 },
    );
  }
}

