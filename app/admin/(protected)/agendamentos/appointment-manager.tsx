"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  Play,
  Scissors,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  initialAppointmentActionState,
  updateAppointmentAction,
  updateAppointmentStatusAction,
} from "@/app/admin/(protected)/agendamentos/actions";
import type {
  AppointmentBarberOption,
  AppointmentServiceOption,
  ManagedAppointment,
} from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/types/domain";

type AppointmentManagerProps = {
  appointment: ManagedAppointment;
  barbers: AppointmentBarberOption[];
  services: AppointmentServiceOption[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
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

const nextStatusAction: Partial<
  Record<AppointmentStatus, { status: AppointmentStatus; label: string; icon: typeof Check }>
> = {
  pending: { status: "confirmed", label: "Confirmar", icon: Check },
  confirmed: { status: "in_progress", label: "Iniciar atendimento", icon: Play },
  in_progress: { status: "completed", label: "Concluir atendimento", icon: CheckCircle2 },
};

const editableStatuses: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];

function formatDate(date: string) {
  const formatted = dateFormatter.format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export function AppointmentManager({
  appointment,
  barbers,
  services,
}: AppointmentManagerProps) {
  const router = useRouter();
  const [statusState, statusAction, isStatusPending] = useActionState(
    updateAppointmentStatusAction,
    initialAppointmentActionState,
  );
  const [editState, editAction, isEditPending] = useActionState(
    updateAppointmentAction,
    initialAppointmentActionState,
  );
  const primaryAction = nextStatusAction[appointment.status];
  const canEdit = editableStatuses.includes(appointment.status);

  useEffect(() => {
    if (statusState.status === "success" || editState.status === "success") {
      router.refresh();
    }
  }, [editState.status, router, statusState.status]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="admin-management-open">
          <Eye aria-hidden="true" /> Gerenciar
        </Button>
      </SheetTrigger>
      <SheetContent className="admin-appointment-sheet">
        <SheetHeader className="admin-appointment-sheet-header">
          <p className="admin-page-kicker">Detalhes do atendimento</p>
          <SheetTitle>{appointment.client.name}</SheetTitle>
          <SheetDescription>
            {formatDate(appointment.date)}, às {appointment.startTime.slice(0, 5)}
          </SheetDescription>
        </SheetHeader>

        <div className="admin-appointment-sheet-body">
          <div className="admin-appointment-current-status">
            <span>Status atual</span>
            <strong className="admin-agenda-status" data-status={appointment.status}>
              {statusLabels[appointment.status]}
            </strong>
          </div>

          <dl className="admin-appointment-details">
            <div>
              <dt><Scissors aria-hidden="true" /> Serviço</dt>
              <dd>{appointment.serviceName}</dd>
              <span>{formatDuration(appointment.durationMinutes)}</span>
            </div>
            <div>
              <dt><UserRound aria-hidden="true" /> Profissional</dt>
              <dd>{appointment.barberName}</dd>
            </div>
            <div>
              <dt><CalendarClock aria-hidden="true" /> Horário</dt>
              <dd>
                {appointment.startTime.slice(0, 5)} — {appointment.endTime.slice(0, 5)}
              </dd>
              <span>{currencyFormatter.format(appointment.priceInCents / 100)}</span>
            </div>
            <div>
              <dt><Phone aria-hidden="true" /> Telefone</dt>
              <dd><a href={`tel:${appointment.client.phone}`}>{appointment.client.phone}</a></dd>
            </div>
            {appointment.client.email ? (
              <div>
                <dt><Mail aria-hidden="true" /> E-mail</dt>
                <dd>
                  <a href={`mailto:${appointment.client.email}`}>
                    {appointment.client.email}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          {canEdit ? (
            <section className="admin-appointment-actions" aria-labelledby={`actions-${appointment.id}`}>
              <header>
                <span>Andamento</span>
                <h3 id={`actions-${appointment.id}`}>Ações rápidas</h3>
              </header>

              <div className="admin-appointment-action-row">
                {primaryAction ? (
                  <form action={statusAction}>
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <Button
                      type="submit"
                      name="nextStatus"
                      value={primaryAction.status}
                      disabled={isStatusPending}
                      className="admin-appointment-primary-action"
                    >
                      {isStatusPending ? <Spinner /> : <primaryAction.icon aria-hidden="true" />}
                      {primaryAction.label}
                    </Button>
                  </form>
                ) : null}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="admin-appointment-cancel-trigger"
                      disabled={isStatusPending}
                    >
                      <XCircle aria-hidden="true" /> Cancelar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="admin-appointment-cancel-dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O horário será marcado como cancelado e continuará disponível no histórico.
                        Nenhum registro será excluído.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <form action={statusAction}>
                        <input type="hidden" name="appointmentId" value={appointment.id} />
                        <AlertDialogAction
                          type="submit"
                          name="nextStatus"
                          value="cancelled"
                          variant="destructive"
                          disabled={isStatusPending}
                        >
                          Confirmar cancelamento
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {statusState.message ? (
                <p className="admin-appointment-feedback" data-status={statusState.status} role="status">
                  {statusState.message}
                </p>
              ) : null}
            </section>
          ) : null}

          {canEdit ? (
            <section className="admin-appointment-edit" aria-labelledby={`edit-${appointment.id}`}>
              <header>
                <span>Organização</span>
                <h3 id={`edit-${appointment.id}`}>Editar agendamento</h3>
              </header>

              <form action={editAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <div className="admin-appointment-edit-grid">
                  <div className="admin-appointment-edit-field">
                    <Label htmlFor={`date-${appointment.id}`}>Data</Label>
                    <input
                      id={`date-${appointment.id}`}
                      name="appointmentDate"
                      type="date"
                      defaultValue={appointment.date}
                      required
                      disabled={isEditPending}
                    />
                  </div>
                  <div className="admin-appointment-edit-field">
                    <Label htmlFor={`time-${appointment.id}`}>Horário inicial</Label>
                    <input
                      id={`time-${appointment.id}`}
                      name="startTime"
                      type="time"
                      defaultValue={appointment.startTime.slice(0, 5)}
                      required
                      disabled={isEditPending}
                    />
                  </div>
                  <div className="admin-appointment-edit-field is-wide">
                    <Label htmlFor={`barber-${appointment.id}`}>Profissional</Label>
                    <NativeSelect
                      id={`barber-${appointment.id}`}
                      name="barberId"
                      defaultValue={appointment.barberId}
                      required
                      disabled={isEditPending}
                    >
                      {barbers.map((barber) => (
                        <NativeSelectOption
                          key={barber.id}
                          value={barber.id}
                          disabled={!barber.active && barber.id !== appointment.barberId}
                        >
                          {barber.name}{barber.active ? "" : " (inativo)"}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="admin-appointment-edit-field is-wide">
                    <Label htmlFor={`service-${appointment.id}`}>Serviço</Label>
                    <NativeSelect
                      id={`service-${appointment.id}`}
                      name="serviceId"
                      defaultValue={appointment.serviceId}
                      required
                      disabled={isEditPending}
                    >
                      {services.map((service) => (
                        <NativeSelectOption
                          key={service.id}
                          value={service.id}
                          disabled={!service.active && service.id !== appointment.serviceId}
                        >
                          {service.name} · {formatDuration(service.durationMinutes)} · {currencyFormatter.format(service.priceInCents / 100)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="admin-appointment-edit-field is-wide">
                    <Label htmlFor={`notes-${appointment.id}`}>Observação</Label>
                    <Textarea
                      id={`notes-${appointment.id}`}
                      name="notes"
                      defaultValue={appointment.notes ?? ""}
                      maxLength={1000}
                      placeholder="Preferências ou informações importantes para o atendimento."
                      disabled={isEditPending}
                    />
                  </div>
                </div>

                {editState.message ? (
                  <p className="admin-appointment-feedback" data-status={editState.status} role="status">
                    {editState.message}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="admin-appointment-save"
                  disabled={isEditPending}
                >
                  {isEditPending ? <Spinner /> : <Check aria-hidden="true" />}
                  {isEditPending ? "Validando disponibilidade" : "Salvar alterações"}
                </Button>
              </form>
            </section>
          ) : (
            <p className="admin-appointment-terminal-note">
              Este atendimento está encerrado. Os dados permanecem disponíveis somente para consulta.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
