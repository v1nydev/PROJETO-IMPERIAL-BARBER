"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";
import {
  createBarberAction,
  initialBarberActionState,
  toggleBarberAction,
  updateBarberAction,
} from "@/app/admin/(protected)/profissionais/actions";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { ManagedBarber } from "@/lib/data/barbers";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function BarberFields({ barber }: { barber?: ManagedBarber }) {
  return (
    <div className="admin-service-form-grid">
      <div className="admin-service-field is-wide">
        <Label htmlFor={barber ? `name-${barber.id}` : "new-barber-name"}>
          Nome do profissional
        </Label>
        <Input
          id={barber ? `name-${barber.id}` : "new-barber-name"}
          name="name"
          defaultValue={barber?.name}
          minLength={2}
          maxLength={120}
          placeholder="Ex.: Arthur Vinícius"
          required
        />
      </div>
      <div className="admin-service-field">
        <Label htmlFor={barber ? `specialty-${barber.id}` : "new-barber-specialty"}>
          Especialidade
        </Label>
        <Input
          id={barber ? `specialty-${barber.id}` : "new-barber-specialty"}
          name="specialty"
          defaultValue={barber?.specialty}
          minLength={2}
          maxLength={160}
          placeholder="Ex.: Fade e cortes modernos"
          required
        />
      </div>
      <div className="admin-service-field">
        <Label htmlFor={barber ? `avatar-${barber.id}` : "new-barber-avatar"}>
          URL da foto
        </Label>
        <Input
          id={barber ? `avatar-${barber.id}` : "new-barber-avatar"}
          name="avatarUrl"
          type="url"
          defaultValue={barber?.avatarUrl ?? ""}
          maxLength={2048}
          placeholder="https://exemplo.com/foto.jpg"
        />
      </div>
      <div className="admin-service-field is-wide">
        <Label htmlFor={barber ? `bio-${barber.id}` : "new-barber-bio"}>
          Biografia profissional
        </Label>
        <Textarea
          id={barber ? `bio-${barber.id}` : "new-barber-bio"}
          name="bio"
          defaultValue={barber?.bio}
          maxLength={1000}
          placeholder="Conte brevemente sobre experiência, técnica e estilo de trabalho."
        />
      </div>
    </div>
  );
}

export function CreateBarberForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createBarberAction,
    initialBarberActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  return (
    <form ref={formRef} action={action} className="admin-service-create-form">
      <BarberFields />
      <div className="admin-service-form-footer">
        {state.message ? (
          <p className="admin-service-feedback" data-status={state.status} role="status">
            {state.message}
          </p>
        ) : (
          <p>Novo profissional será cadastrado como ativo.</p>
        )}
        <Button type="submit" className="admin-service-primary" disabled={isPending}>
          {isPending ? <Spinner /> : <Plus aria-hidden="true" />}
          {isPending ? "Cadastrando profissional" : "Adicionar profissional"}
        </Button>
      </div>
    </form>
  );
}

function BarberManager({ barber }: { barber: ManagedBarber }) {
  const router = useRouter();
  const [editState, editAction, isEditPending] = useActionState(
    updateBarberAction,
    initialBarberActionState,
  );
  const [toggleState, toggleAction, isTogglePending] = useActionState(
    toggleBarberAction,
    initialBarberActionState,
  );

  useEffect(() => {
    if (editState.status === "success" || toggleState.status === "success") {
      router.refresh();
    }
  }, [editState, router, toggleState]);

  return (
    <div className="admin-professional-actions">
      <Button asChild variant="outline" className="admin-service-edit-trigger">
        <Link href={`/admin/agenda?view=today&barber=${barber.id}`}>
          <CalendarDays aria-hidden="true" /> Agenda
        </Link>
      </Button>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="admin-service-edit-trigger">
            <Pencil aria-hidden="true" /> Editar
          </Button>
        </SheetTrigger>
        <SheetContent className="admin-service-sheet">
          <SheetHeader className="admin-service-sheet-header">
            <p className="admin-page-kicker">Editar profissional</p>
            <SheetTitle>{barber.name}</SheetTitle>
            <SheetDescription>
              As alterações preservam atendimentos e registros anteriores.
            </SheetDescription>
          </SheetHeader>
          <form action={editAction} className="admin-service-edit-form">
            <input type="hidden" name="barberId" value={barber.id} />
            <BarberFields barber={barber} />
            {editState.message ? (
              <p className="admin-service-feedback" data-status={editState.status} role="status">
                {editState.message}
              </p>
            ) : null}
            <Button type="submit" className="admin-service-primary" disabled={isEditPending}>
              {isEditPending ? <Spinner /> : <Check aria-hidden="true" />}
              {isEditPending ? "Salvando alterações" : "Salvar alterações"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="admin-service-toggle-trigger"
            data-active={barber.active}
            disabled={isTogglePending}
          >
            {barber.active ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
            {barber.active ? "Desativar" : "Ativar"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="admin-service-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {barber.active
                ? "Desativar este profissional?"
                : "Ativar este profissional?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {barber.active
                ? `${barber.openAppointmentCount} atendimento(s) em aberto continuarão no histórico e deverão ser reorganizados quando necessário.`
                : "O profissional voltará a ficar disponível para novos agendamentos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <form action={toggleAction}>
              <input type="hidden" name="barberId" value={barber.id} />
              <input type="hidden" name="nextActive" value={String(!barber.active)} />
              <AlertDialogAction type="submit" disabled={isTogglePending}>
                {barber.active ? "Confirmar desativação" : "Ativar profissional"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toggleState.message ? (
        <span className="sr-only" aria-live="polite">{toggleState.message}</span>
      ) : null}
    </div>
  );
}

export function ProfessionalRow({
  barber,
  index,
}: {
  barber: ManagedBarber;
  index: number;
}) {
  const workingDays = new Set(
    barber.availability.map((window) => window.dayOfWeek),
  ).size;

  return (
    <li data-active={barber.active}>
      <span className="admin-service-index">{String(index + 1).padStart(2, "0")}</span>
      <Avatar className="admin-professional-avatar">
        {barber.avatarUrl ? (
          <AvatarImage src={barber.avatarUrl} alt={`Foto de ${barber.name}`} />
        ) : null}
        <AvatarFallback>{getInitials(barber.name)}</AvatarFallback>
      </Avatar>
      <div className="admin-professional-identity">
        <span>Profissional</span>
        <strong>{barber.name}</strong>
        <small>{barber.specialty}</small>
      </div>
      <div className="admin-professional-fact is-availability">
        <span>Disponibilidade</span>
        <strong>
          {workingDays
            ? `${workingDays} ${workingDays === 1 ? "dia" : "dias"} por semana`
            : "Não configurada"}
        </strong>
      </div>
      <div className="admin-professional-fact is-appointments">
        <span>Atendimentos</span>
        <strong>{barber.appointmentCount} no histórico</strong>
        <small>{barber.openAppointmentCount} em aberto</small>
      </div>
      <span className="admin-service-status" data-active={barber.active}>
        {barber.active ? "Ativo" : "Inativo"}
      </span>
      <BarberManager barber={barber} />
    </li>
  );
}
