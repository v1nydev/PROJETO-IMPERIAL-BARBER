import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdministrativeAccess } from "@/lib/auth/admin";
import { LoginForm } from "@/app/admin/login/login-form";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const [access, params] = await Promise.all([
    getAdministrativeAccess(),
    searchParams,
  ]);

  if (access.status === "authorized") {
    redirect("/admin");
  }

  const accessMessage =
    params.error === "not-authorized"
      ? "Sua conta está autenticada, mas não possui acesso ativo ao painel."
      : params.error === "unavailable"
        ? "Não foi possível verificar sua permissão agora. Tente novamente."
        : null;

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-brand" aria-label="Imperial Barber">
        <Link href="/" className="admin-auth-wordmark" aria-label="Voltar ao site">
          <span className="admin-auth-monogram">IB</span>
          <span>
            <strong>Imperial</strong>
            <small>Barber · São Paulo</small>
          </span>
        </Link>

        <div className="admin-auth-statement">
          <p>Área reservada</p>
          <h1>
            Gestão com a mesma
            <em> precisão do ofício.</em>
          </h1>
        </div>

        <span className="admin-auth-index">Acesso · 01</span>
      </section>

      <section className="admin-auth-panel">
        <div className="admin-auth-panel-inner">
          <p className="admin-auth-kicker">Painel administrativo</p>
          <h2>Bem-vindo de volta.</h2>
          <p className="admin-auth-copy">
            Entre com a conta autorizada para acessar a operação da barbearia.
          </p>

          {accessMessage ? (
            <p className="admin-access-message" role="alert">
              {accessMessage}
            </p>
          ) : null}

          <LoginForm />

          <Link href="/" className="admin-back-link">
            ← Voltar para o site
          </Link>
        </div>
      </section>
    </main>
  );
}
