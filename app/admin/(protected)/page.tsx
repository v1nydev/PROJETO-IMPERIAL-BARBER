import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/admin/actions";

export default function AdminAccessConfirmedPage() {
  return (
    <main className="admin-access-page">
      <section className="admin-access-card">
        <span className="admin-access-icon" aria-hidden="true">
          <ShieldCheck />
        </span>
        <p className="admin-auth-kicker">Sessão verificada</p>
        <h1>Acesso autorizado.</h1>
        <p>
          Sua sessão está ativa. A estrutura visual do painel será criada na
          próxima etapa do projeto.
        </p>
        <form action={logoutAction}>
          <Button type="submit" size="lg" className="admin-logout-button">
            Sair da conta
          </Button>
        </form>
      </section>
    </main>
  );
}
