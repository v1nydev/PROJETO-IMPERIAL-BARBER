import { CalendarClock } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <p className="admin-page-kicker">Visão geral</p>
        <h1>Dashboard</h1>
        <p>Acompanhe a operação da Imperial Barber em um só lugar.</p>
      </header>

      <section className="admin-workspace" aria-labelledby="dashboard-empty-title">
        <Empty className="admin-empty-state">
          <EmptyMedia variant="icon">
            <CalendarClock aria-hidden="true" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle id="dashboard-empty-title">
              O resumo do dia aparecerá aqui.
            </EmptyTitle>
            <EmptyDescription>
              A estrutura do painel está pronta. Os dados operacionais serão
              conectados na próxima etapa.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    </div>
  );
}
