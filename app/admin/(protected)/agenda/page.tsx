import Link from "next/link";
import {
  CalendarX2,
  CircleAlert,
  Filter,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  getAgendaData,
  normalizeAgendaFilters,
  type AgendaAppointment,
  type AgendaFilters,
  type AgendaView,
} from "@/lib/data/agenda";
import type { AppointmentStatus } from "@/types/domain";

type SearchValue = string | string[] | undefined;

type AgendaPageProps = {
  searchParams: Promise<Record<string, SearchValue>>;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const compactDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: "UTC",
});

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function firstValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: string, formatter = compactDateFormatter) {
  const formatted = formatter.format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function formatCurrency(valueInCents: number) {
  return currencyFormatter.format(valueInCents / 100);
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function getViewHref(view: AgendaView, filters: AgendaFilters) {
  const params = new URLSearchParams({ view });

  if (filters.barberId) {
    params.set("barber", filters.barberId);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return `/admin/agenda?${params.toString()}`;
}

function groupByDate(appointments: AgendaAppointment[]) {
  const groups = new Map<string, AgendaAppointment[]>();

  appointments.forEach((appointment) => {
    const group = groups.get(appointment.date) ?? [];
    group.push(appointment);
    groups.set(appointment.date, group);
  });

  return [...groups.entries()];
}

function getDayLabel(date: string, todayDate: string) {
  if (date === todayDate) {
    return "Hoje";
  }

  if (date === addDays(todayDate, 1)) {
    return "Amanhã";
  }

  return formatDate(date, weekdayFormatter);
}

export default async function AdminAgendaPage({ searchParams }: AgendaPageProps) {
  const params = await searchParams;
  const filters = normalizeAgendaFilters({
    view: firstValue(params.view),
    barber: firstValue(params.barber),
    status: firstValue(params.status),
    date: firstValue(params.date),
  });
  const result = await getAgendaData(filters);

  if (result.status === "error") {
    return (
      <div className="admin-page">
        <header className="admin-page-heading">
          <p className="admin-page-kicker">Operação diária</p>
          <h1>Agenda</h1>
        </header>

        <Alert variant="destructive" className="admin-error-state">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Não foi possível carregar a agenda.</AlertTitle>
          <AlertDescription>
            Atualize a página para tentar novamente. Nenhum dado foi alterado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data } = result;
  const groupedAppointments = groupByDate(data.appointments);
  const hasFilters = Boolean(filters.barberId || filters.status || filters.date);
  const periodLabel = filters.date
    ? formatDate(filters.date, longDateFormatter)
    : filters.view === "today"
      ? formatDate(data.todayDate, longDateFormatter)
      : `${formatDate(data.rangeStart)} — ${formatDate(data.rangeEnd)}`;

  return (
    <div className="admin-page admin-agenda-page">
      <header className="admin-page-heading admin-agenda-heading">
        <div>
          <p className="admin-page-kicker">Operação diária</p>
          <h1>Agenda</h1>
          <p>Horários, profissionais e andamento dos atendimentos.</p>
        </div>
        <div className="admin-agenda-period" aria-live="polite">
          <span>{filters.date ? "Data selecionada" : "Período"}</span>
          <strong>{periodLabel}</strong>
        </div>
      </header>

      <nav className="admin-agenda-views" aria-label="Visualização da agenda">
        <Link
          href={getViewHref("today", filters)}
          aria-current={filters.view === "today" && !filters.date ? "page" : undefined}
          data-active={filters.view === "today" && !filters.date}
        >
          Hoje
        </Link>
        <Link
          href={getViewHref("upcoming", filters)}
          aria-current={
            filters.view === "upcoming" && !filters.date ? "page" : undefined
          }
          data-active={filters.view === "upcoming" && !filters.date}
        >
          Próximos 7 dias
        </Link>
      </nav>

      <form className="admin-agenda-filters" action="/admin/agenda" method="get">
        <input type="hidden" name="view" value={filters.view} />
        <div className="admin-agenda-filter-heading">
          <Filter aria-hidden="true" />
          <span>Filtrar agenda</span>
        </div>

        <label className="admin-agenda-filter-control">
          <span>Profissional</span>
          <NativeSelect name="barber" defaultValue={filters.barberId ?? ""}>
            <NativeSelectOption value="">Todos</NativeSelectOption>
            {data.barbers.map((barber) => (
              <NativeSelectOption key={barber.id} value={barber.id}>
                {barber.name}{barber.active ? "" : " (inativo)"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>

        <label className="admin-agenda-filter-control">
          <span>Status</span>
          <NativeSelect name="status" defaultValue={filters.status ?? ""}>
            <NativeSelectOption value="">Todos</NativeSelectOption>
            {Object.entries(statusLabels).map(([status, label]) => (
              <NativeSelectOption key={status} value={status}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>

        <label className="admin-agenda-filter-control">
          <span>Data</span>
          <input type="date" name="date" defaultValue={filters.date ?? ""} />
        </label>

        <div className="admin-agenda-filter-actions">
          <Button type="submit" className="admin-agenda-filter-submit">
            Aplicar filtros
          </Button>
          {hasFilters ? (
            <Button asChild variant="ghost" className="admin-agenda-filter-reset">
              <Link href={`/admin/agenda?view=${filters.view}`}>
                <RotateCcw aria-hidden="true" /> Limpar
              </Link>
            </Button>
          ) : null}
        </div>
      </form>

      <section className="admin-agenda-workspace" aria-labelledby="agenda-list-title">
        <header className="admin-agenda-workspace-heading">
          <div>
            <p className="admin-page-kicker">Horários</p>
            <h2 id="agenda-list-title">
              {data.appointments.length
                ? `${data.appointments.length} ${
                    data.appointments.length === 1 ? "atendimento" : "atendimentos"
                  }`
                : "Nenhum atendimento"}
            </h2>
          </div>
          <span>Ordenados por data e horário</span>
        </header>

        {groupedAppointments.length ? (
          <div className="admin-agenda-days">
            {groupedAppointments.map(([date, appointments]) => (
              <section key={date} className="admin-agenda-day">
                <header>
                  <div>
                    <span>{getDayLabel(date, data.todayDate)}</span>
                    <time dateTime={date}>{formatDate(date)}</time>
                  </div>
                  <small>
                    {appointments.length} {appointments.length === 1 ? "horário" : "horários"}
                  </small>
                </header>

                <ol className="admin-agenda-list">
                  {appointments.map((appointment) => (
                    <li key={appointment.id}>
                      <time
                        className="admin-agenda-time"
                        dateTime={`${appointment.date}T${appointment.startTime}`}
                      >
                        <strong>{formatTime(appointment.startTime)}</strong>
                        <span>até {formatTime(appointment.endTime)}</span>
                      </time>

                      <div className="admin-agenda-client">
                        <span>Cliente</span>
                        <strong>{appointment.clientName}</strong>
                      </div>

                      <div className="admin-agenda-service">
                        <span>Serviço</span>
                        <strong>{appointment.serviceName}</strong>
                      </div>

                      <div className="admin-agenda-barber">
                        <span>Profissional</span>
                        <strong>{appointment.barberName}</strong>
                      </div>

                      <div className="admin-agenda-duration">
                        <span>Duração</span>
                        <strong>{formatDuration(appointment.durationMinutes)}</strong>
                      </div>

                      <div className="admin-agenda-price">
                        <span>Preço</span>
                        <strong>{formatCurrency(appointment.priceInCents)}</strong>
                      </div>

                      <span
                        className="admin-agenda-status"
                        data-status={appointment.status}
                      >
                        {statusLabels[appointment.status]}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <Empty className="admin-agenda-empty">
            <EmptyMedia variant="icon">
              <CalendarX2 aria-hidden="true" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nenhum horário encontrado.</EmptyTitle>
              <EmptyDescription>
                Ajuste os filtros ou consulte outro período da agenda.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
