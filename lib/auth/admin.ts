import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export type AdministrativeRole = "admin" | "barber";

export type AdministrativeActor = {
  id: string;
  email: string;
  role: AdministrativeRole;
};

export type AdministrativeAccess =
  | { status: "anonymous" }
  | { status: "forbidden" }
  | { status: "unavailable" }
  | { status: "authorized"; actor: AdministrativeActor };

export async function getAdministrativeAccess(
  client?: ServerSupabaseClient,
): Promise<AdministrativeAccess> {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { status: "anonymous" };
  }

  const userId = claimsData.claims.sub;
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return { status: "unavailable" };
  }

  if (
    !profile?.active ||
    (profile.role !== "admin" && profile.role !== "barber")
  ) {
    return { status: "forbidden" };
  }

  const emailClaim = claimsData.claims.email;

  return {
    status: "authorized",
    actor: {
      id: userId,
      email: typeof emailClaim === "string" ? emailClaim : "Conta autenticada",
      role: profile.role,
    },
  };
}

export async function requireAdministrativeActor(): Promise<AdministrativeActor> {
  const access = await getAdministrativeAccess();

  if (access.status === "authorized") {
    return access.actor;
  }

  if (access.status === "forbidden") {
    redirect("/admin/login?error=not-authorized");
  }

  if (access.status === "unavailable") {
    redirect("/admin/login?error=unavailable");
  }

  redirect("/admin/login");
}
