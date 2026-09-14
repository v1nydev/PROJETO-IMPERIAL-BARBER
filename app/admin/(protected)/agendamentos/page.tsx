import { CircleAlert, ClipboardList } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AppointmentManager } from "@/app/admin/(protected)/agendamentos/appointment-manager";
import {
  getAppointmentManagementData,
  type ManagedAppointment,
} from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/types/domain";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const operationalStatuses: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];

function formatDate(date: string) {
  const formatted = dateFormatter
    .format(new Date(`${date}T12:00:00Z`))
    .replaceAll(".", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function compareAscending(first: ManagedAppointment, second: ManagedAppointment) {
  return `${first.date}T${first.startTime}`.localeCompare(
    `${second.date}T${second.startTime}`,
  );
}

function compareDescending(first: ManagedAppointment, second: ManagedAppointment) {
  return compareAscending(second, first);
}

export default async function AdminAppointmentsPage() {
  const result = await getAppointmentManagementData();

  if (result.status === "error") {
    return (
      <div className="admin-page">
        <header className="admin-page-heading">
          <p className="admin-page-kicker">Atendimentos</p>
          <h1>Agendamentos</h1>
        </header>

        <Alert variant="destructive" className="admin-error-state">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar os agendamentos.</AlertTitle>
          <AlertDescription>
            Atualize a página para tentar novamente. Nenhum dado foi alterado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data } = result;
  const openAppointments = data.appointments
    .filter((appointment) => operationalStatuses.includes(appointment.status))
    .sort(compareAscending);
  const appointmentHistory = data.appointments
    .filter((appointment) => !operationalStatuses.includes(appointment.status))
    .sort(compareDescending);
  const statusCounts = data.appointments.reduce<Record<AppointmentStatus, number>>(
    (counts, appointment) => {
      counts[appointment.status] += 1;
      return counts;
    },
    {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
  );

  return (
    <div className="admin-page admin-appointments-page">
      <header className="admin-page-heading admin-appointments-heading">
        <div>
          <p className="admin-page-kicker">Atendimentos</p>
          <h1>Agendamentos</h1>
          <p>Atualize o andamento e reorganize os horários da casa.</p>
        </div>
        <div className="admin-appointments-total">
          <span>Em aberto</span>
          <strong>{openAppointments.length}</strong>
        </div>
      </header>

      <section className="admin-appointments-status-summary" aria-label="Resumo por status">
        {(["pending", "confirmed", "in_progress"] as AppointmentStatus[]).map(
          (status) => (
            <div key={status}>
              <span>{statusLabels[status]}</span>
              <strong>{statusCounts[status]}</strong>
            </div>
          ),
        )}
      </section>

      <section className="admin-appointments-section" aria-labelledby="open-title">
        <header>
          <div>
            <p className="admin-page-kicker">Operação</p>
            <h2 id="open-title">Atendimentos em aberto</h2>
          </div>
          <span>Os próximos compromissos aparecem primeiro</span>
        </header>

        {openAppointments.length ? (
          <ol className="admin-management-list">
            {openAppointments.map((appointment) => (
              <li key={appointment.id}>
                <time dateTime={`${appointment.date}T${appointment.startTime}`}>
                  <strong>{appointment.startTime.slice(0, 5)}</strong>
                  <span>{formatDate(appointment.date)}</span>
                </time>
                <div className="admin-management-client">
                  <span>Cliente</span>
                  <strong>{appointment.client.name}</strong>
                </div>
                <div className="admin-management-service">
                  <span>Serviço</span>
                  <strong>{appointment.serviceName}</strong>
                  <small>{appointment.barberName}</small>
                </div>
                <div className="admin-management-value">
                  <strong>{currencyFormatter.format(appointment.priceInCents / 100)}</strong>
                  <span className="admin-agenda-status" data-status={appointment.status}>
                    {statusLabels[appointment.status]}
                  </span>
                </div>
                <AppointmentManager
                  appointment={appointment}
                  barbers={data.barbers}
                  services={data.services}
                />
              </li>
            ))}
          </ol>
        ) : (
          <Empty className="admin-management-empty">
            <EmptyMedia variant="icon">
              <ClipboardList aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nenhum atendimento em aberto.</EmptyTitle>
              <EmptyDescription>
                Novos agendamentos pendentes ou confirmados aparecerão aqui.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      <section className="admin-appointments-section" aria-labelledby="history-title">
        <header>
          <div>
            <p className="admin-page-kicker">Registro</p>
            <h2 id="history-title">Histórico recente</h2>
          </div>
          <span>Concluídos, cancelados e não comparecimentos</span>
        </header>

        {appointmentHistory.length ? (
          <ol className="admin-management-list is-history">
            {appointmentHistory.map((appointment) => (
              <li key={appointment.id}>
                <time dateTime={`${appointment.date}T${appointment.startTime}`}>
                  <strong>{appointment.startTime.slice(0, 5)}</strong>
                  <span>{formatDate(appointment.date)}</span>
                </time>
                <div className="admin-management-client">
                  <span>Cliente</span>
                  <strong>{appointment.client.name}</strong>
                </div>
                <div className="admin-management-service">
                  <span>Serviço</span>
                  <strong>{appointment.serviceName}</strong>
                  <small>{appointment.barberName}</small>
                </div>
                <div className="admin-management-value">
                  <strong>{currencyFormatter.format(appointment.priceInCents / 100)}</strong>
                  <span className="admin-agenda-status" data-status={appointment.status}>
                    {statusLabels[appointment.status]}
                  </span>
                </div>
                <AppointmentManager
                  appointment={appointment}
                  barbers={data.barbers}
                  services={data.services}
                />
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  );
}
