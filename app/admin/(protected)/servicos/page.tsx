import { CircleAlert, Scissors } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  CreateServiceForm,
  ServiceCatalogRow,
} from "@/app/admin/(protected)/servicos/service-management";
import { getServiceManagementData } from "@/lib/data/services";

export default async function AdminServicesPage() {
  const result = await getServiceManagementData();

  if (result.status === "error") {
    return (
      <div className="admin-page">
        <header className="admin-page-heading">
          <p className="admin-page-kicker">Menu da casa</p>
          <h1>Serviços</h1>
        </header>
        <Alert variant="destructive" className="admin-error-state">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar os serviços.</AlertTitle>
          <AlertDescription>
            Atualize a página para tentar novamente. Nenhum dado foi alterado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeCount = result.services.filter((service) => service.active).length;
  const inactiveCount = result.services.length - activeCount;

  return (
    <div className="admin-page admin-services-page">
      <header className="admin-page-heading admin-services-heading">
        <div>
          <p className="admin-page-kicker">Menu da casa</p>
          <h1>Serviços</h1>
          <p>Organize o catálogo, a duração e os valores dos atendimentos.</p>
        </div>
        <div className="admin-services-total">
          <span>Disponíveis</span>
          <strong>{activeCount}</strong>
        </div>
      </header>

      <section className="admin-services-summary" aria-label="Resumo do catálogo">
        <div><span>Total</span><strong>{result.services.length}</strong></div>
        <div><span>Ativos</span><strong>{activeCount}</strong></div>
        <div><span>Inativos</span><strong>{inactiveCount}</strong></div>
      </section>

      <section className="admin-services-create" aria-labelledby="new-service-title">
        <header>
          <div>
            <p className="admin-page-kicker">Novo item</p>
            <h2 id="new-service-title">Adicionar ao menu</h2>
          </div>
          <span>Preencha as informações comerciais do serviço</span>
        </header>
        <CreateServiceForm />
      </section>

      <section className="admin-services-catalog" aria-labelledby="services-catalog-title">
        <header>
          <div>
            <p className="admin-page-kicker">Catálogo</p>
            <h2 id="services-catalog-title">Serviços cadastrados</h2>
          </div>
          <span>Itens inativos permanecem no histórico</span>
        </header>

        {result.services.length ? (
          <ol className="admin-services-list">
            {result.services.map((service, index) => (
              <ServiceCatalogRow key={service.id} service={service} index={index} />
            ))}
          </ol>
        ) : (
          <Empty className="admin-management-empty">
            <EmptyMedia variant="icon"><Scissors aria-hidden="true" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nenhum serviço cadastrado.</EmptyTitle>
              <EmptyDescription>
                Use o formulário acima para criar o primeiro item do menu.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
