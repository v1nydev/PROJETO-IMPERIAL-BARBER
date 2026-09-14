"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdministrativeAccess } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});

export type LoginState = {
  status: "idle" | "error";
  message: string | null;
};

export const initialLoginState: LoginState = {
  status: "idle",
  message: null,
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail válido e sua senha.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: "E-mail ou senha inválidos.",
    };
  }

  const access = await getAdministrativeAccess(supabase);

  if (access.status !== "authorized") {
    await supabase.auth.signOut({ scope: "local" });

    return {
      status: "error",
      message:
        access.status === "unavailable"
          ? "Não foi possível validar sua permissão. Tente novamente."
          : "Esta conta não possui acesso ao painel.",
    };
  }

  redirect("/admin");
}
