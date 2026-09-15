import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SettingsForm } from "@/app/admin/(protected)/configuracoes/settings-form";
import { getShopSettings } from "@/lib/data/settings";

const updatedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminSettingsPage() {
  const result = await getShopSettings();

  if (result.status === "error") {
    return (
      <div className="admin-page">
        <header className="admin-page-heading">
          <p className="admin-page-kicker">Preferências</p>
          <h1>Configurações</h1>
        </header>
        <Alert variant="destructive" className="admin-error-state">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar as configurações.</AlertTitle>
          <AlertDescription>
            Atualize a página para tentar novamente. Nenhum dado foi alterado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="admin-page admin-settings-page">
      <header className="admin-page-heading admin-settings-heading">
        <div>
          <p className="admin-page-kicker">Preferências</p>
          <h1>Configurações</h1>
          <p>Centralize as informações essenciais da Imperial Barber.</p>
        </div>
        <p className="admin-settings-updated">
          <span>Última atualização</span>
          <time dateTime={result.settings.updatedAt}>
            {updatedAtFormatter.format(new Date(result.settings.updatedAt))}
          </time>
        </p>
      </header>

      <section className="admin-settings-workspace" aria-label="Dados da barbearia">
        <header>
          <div>
            <p className="admin-page-kicker">Estabelecimento</p>
            <h2>Informações da casa</h2>
          </div>
          <span>Dados institucionais e de atendimento</span>
        </header>
        <SettingsForm settings={result.settings} />
      </section>
    </div>
  );
}
