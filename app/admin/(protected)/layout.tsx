import { requireAdministrativeActor } from "@/lib/auth/admin";
import { AdminShell } from "@/app/admin/(protected)/admin-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await requireAdministrativeActor();

  return <AdminShell actor={actor}>{children}</AdminShell>;
}
