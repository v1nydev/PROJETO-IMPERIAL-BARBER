import { CircleAlert, UsersRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  CreateBarberForm,
  ProfessionalRow,
} from "@/app/admin/(protected)/profissionais/professional-management";
import { getBarberManagementData } from "@/lib/data/barbers";

export default async function AdminProfessionalsPage() {
  const result = await getBarberManagementData();

  if (result.status === "error") {
    return (
      <div className="admin-page">
        <header className="admin-page-heading">
          <p className="admin-page-kicker">Equipe</p>
          <h1>Profissionais</h1>
        </header>
        <Alert variant="destructive" className="admin-error-state">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar os profissionais.</AlertTitle>
          <AlertDescription>
            Atualize a página para tentar novamente. Nenhum dado foi alterado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeCount = result.barbers.filter((barber) => barber.active).length;
  const inactiveCount = result.barbers.length - activeCount;

  return (
    <div className="admin-page admin-services-page admin-professionals-page">
      <header className="admin-page-heading admin-services-heading">
        <div>
          <p className="admin-page-kicker">Equipe</p>
          <h1>Profissionais</h1>
          <p>Organize perfis, especialidades e acesso à agenda individual.</p>
        </div>
        <div className="admin-services-total">
          <span>Em atividade</span>
          <strong>{activeCount}</strong>
        </div>
      </header>

      <section className="admin-services-summary" aria-label="Resumo da equipe">
        <div><span>Total</span><strong>{result.barbers.length}</strong></div>
        <div><span>Ativos</span><strong>{activeCount}</strong></div>
        <div><span>Inativos</span><strong>{inactiveCount}</strong></div>
      </section>

      <section className="admin-services-create" aria-labelledby="new-barber-title">
        <header>
          <div>
            <p className="admin-page-kicker">Novo perfil</p>
            <h2 id="new-barber-title">Adicionar à equipe</h2>
          </div>
          <span>Cadastre identidade e especialidade profissional</span>
        </header>
        <CreateBarberForm />
      </section>

      <section className="admin-services-catalog" aria-labelledby="professionals-title">
        <header>
          <div>
            <p className="admin-page-kicker">Equipe atual</p>
            <h2 id="professionals-title">Profissionais cadastrados</h2>
          </div>
          <span>Perfis inativos permanecem ligados ao histórico</span>
        </header>

        {result.barbers.length ? (
          <ol className="admin-professionals-list">
            {result.barbers.map((barber, index) => (
              <ProfessionalRow key={barber.id} barber={barber} index={index} />
            ))}
          </ol>
        ) : (
          <Empty className="admin-management-empty">
            <EmptyMedia variant="icon"><UsersRound aria-hidden="true" /></EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nenhum profissional cadastrado.</EmptyTitle>
              <EmptyDescription>
                Use o formulário acima para cadastrar o primeiro perfil.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
