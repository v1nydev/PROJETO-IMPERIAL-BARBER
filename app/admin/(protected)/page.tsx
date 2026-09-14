import Link from "next/link";
import { ArrowUpRight, CalendarX2, CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDashboardData } from "@/lib/data/dashboard";
import type { AppointmentStatus } from "@/types/domain";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function formatCurrency(valueInCents: number) {
  return currencyFormatter.format(valueInCents / 100);
}

function formatDate(date: string) {
  const formatted = dateFormatter.format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatShortDate(date: string) {
  return shortDateFormatter
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function AdminDashboardPage() {
  const result = await getDashboardData();

  if (result.status === "error") {
    return (
      <div className="admin-page">
        <header className="admin-page-heading">
          <p className="admin-page-kicker">Visão geral</p>
          <h1>Dashboard</h1>
        </header>

        <Alert variant="destructive" className="admin-error-state">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar o resumo.</AlertTitle>
          <AlertDescription>
            Atualize a página para tentar novamente. Nenhum dado foi alterado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data } = result;
  const summary = [
    {
      label: "Faturamento previsto",
      value: formatCurrency(data.today.expectedRevenueInCents),
      detail: "Pendentes, confirmados e em atendimento",
      emphasis: true,
    },
    {
      label: "Faturamento realizado",
      value: formatCurrency(data.today.realizedRevenueInCents),
      detail: "Somente atendimentos concluídos",
    },
    {
      label: "Agendamentos",
      value: data.today.appointmentCount.toString(),
      detail: "Total previsto para hoje",
    },
    {
      label: "Concluídos",
      value: data.today.completedCount.toString(),
      detail: "Atendimentos finalizados",
    },
    {
      label: "Cancelamentos",
      value: data.today.cancellationCount.toString(),
      detail: "Registros cancelados hoje",
    },
  ];
  const insights = [
    {
      label: "Ticket médio realizado",
      value: formatCurrency(data.month.averageTicketInCents),
      detail: "Atendimentos concluídos no mês",
    },
    {
      label: "Serviço mais agendado",
      value: data.month.topService?.name ?? "Sem dados",
      detail: data.month.topService
        ? `${data.month.topService.count} agendamentos no mês`
        : "Nenhum atendimento no período",
    },
    {
      label: "Profissional com mais atendimentos",
      value: data.month.topBarber?.name ?? "Sem dados",
      detail: data.month.topBarber
        ? `${data.month.topBarber.count} agendamentos no mês`
        : "Nenhum atendimento no período",
    },
    {
      label: "Taxa de cancelamento",
      value: `${percentageFormatter.format(data.month.cancellationRate)}%`,
      detail: "Cancelamentos sobre o total do mês",
    },
  ];

  return (
    <div className="admin-page admin-dashboard-page">
      <header className="admin-page-heading admin-dashboard-heading">
        <div>
          <p className="admin-page-kicker">Visão geral</p>
          <h1>O ritmo da casa, hoje.</h1>
        </div>
        <time dateTime={data.date}>{formatDate(data.date)}</time>
      </header>

      <section
        className="admin-dashboard-summary"
        aria-labelledby="today-summary-title"
      >
        <h2 id="today-summary-title" className="sr-only">
          Resumo de hoje
        </h2>
        <dl>
          {summary.map((metric) => (
            <div
              key={metric.label}
              className={metric.emphasis ? "is-emphasized" : undefined}
            >
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
              <span>{metric.detail}</span>
            </div>
          ))}
        </dl>
      </section>

      <div className="admin-dashboard-detail-grid">
        <section
          className="admin-upcoming-section"
          aria-labelledby="upcoming-title"
        >
          <header className="admin-dashboard-section-heading">
            <div>
              <p className="admin-page-kicker">Próximos atendimentos</p>
              <h2 id="upcoming-title">Na sequência</h2>
            </div>
            <Link href="/admin/agendamentos">
              Ver agendamentos <ArrowUpRight aria-hidden="true" />
            </Link>
          </header>

          {data.upcomingAppointments.length ? (
            <ol className="admin-upcoming-list">
              {data.upcomingAppointments.map((appointment) => (
                <li key={appointment.id}>
                  <time
                    dateTime={`${appointment.date}T${appointment.startTime}`}
                    className="admin-appointment-time"
                  >
                    <span>{formatShortDate(appointment.date)}</span>
                    <strong>{formatTime(appointment.startTime)}</strong>
                  </time>

                  <div className="admin-appointment-client">
                    <strong>{appointment.clientName}</strong>
                    <span>{appointment.serviceName}</span>
                  </div>

                  <div className="admin-appointment-barber">
                    <span>Profissional</span>
                    <strong>{appointment.barberName}</strong>
                  </div>

                  <div className="admin-appointment-value">
                    <strong>{formatCurrency(appointment.priceInCents)}</strong>
                    <span data-status={appointment.status}>
                      {statusLabels[appointment.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Empty className="admin-dashboard-empty">
              <EmptyMedia variant="icon">
                <CalendarX2 aria-hidden="true" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Nenhum atendimento a caminho.</EmptyTitle>
                <EmptyDescription>
                  Novos horários confirmados ou pendentes aparecerão aqui.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <aside
          className="admin-month-insights"
          aria-labelledby="month-insights-title"
        >
          <header className="admin-dashboard-section-heading">
            <div>
              <p className="admin-page-kicker">Leitura do mês</p>
              <h2 id="month-insights-title">Indicadores</h2>
            </div>
          </header>

          <dl>
            {insights.map((insight) => (
              <div key={insight.label}>
                <dt>{insight.label}</dt>
                <dd>{insight.value}</dd>
                <span>{insight.detail}</span>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
