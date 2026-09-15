"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Power, PowerOff } from "lucide-react";
import {
  createServiceAction,
  initialServiceActionState,
  toggleServiceAction,
  updateServiceAction,
} from "@/app/admin/(protected)/servicos/actions";
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
import type { ManagedService } from "@/lib/data/services";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function ServiceFields({ service }: { service?: ManagedService }) {
  return (
    <div className="admin-service-form-grid">
      <div className="admin-service-field is-wide">
        <Label htmlFor={service ? `name-${service.id}` : "new-service-name"}>
          Nome do serviço
        </Label>
        <Input
          id={service ? `name-${service.id}` : "new-service-name"}
          name="name"
          defaultValue={service?.name}
          minLength={2}
          maxLength={120}
          placeholder="Ex.: Corte clássico"
          required
        />
      </div>
      <div className="admin-service-field">
        <Label htmlFor={service ? `duration-${service.id}` : "new-service-duration"}>
          Duração em minutos
        </Label>
        <Input
          id={service ? `duration-${service.id}` : "new-service-duration"}
          name="durationMinutes"
          type="number"
          defaultValue={service?.durationMinutes}
          min={5}
          max={480}
          step={5}
          placeholder="50"
          required
        />
      </div>
      <div className="admin-service-field">
        <Label htmlFor={service ? `price-${service.id}` : "new-service-price"}>
          Preço em reais
        </Label>
        <Input
          id={service ? `price-${service.id}` : "new-service-price"}
          name="price"
          type="number"
          defaultValue={service ? (service.priceInCents / 100).toFixed(2) : undefined}
          min={0}
          max={99_999_999.99}
          step="0.01"
          placeholder="75,00"
          required
        />
      </div>
      <div className="admin-service-field is-wide">
        <Label htmlFor={service ? `description-${service.id}` : "new-service-description"}>
          Descrição
        </Label>
        <Textarea
          id={service ? `description-${service.id}` : "new-service-description"}
          name="description"
          defaultValue={service?.description}
          maxLength={600}
          placeholder="Descreva brevemente o que está incluído."
        />
      </div>
    </div>
  );
}

export function CreateServiceForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    createServiceAction,
    initialServiceActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  return (
    <form ref={formRef} action={action} className="admin-service-create-form">
      <ServiceFields />
      <div className="admin-service-form-footer">
        {state.message ? (
          <p className="admin-service-feedback" data-status={state.status} role="status">
            {state.message}
          </p>
        ) : (
          <p>Novo serviço será criado como ativo.</p>
        )}
        <Button type="submit" className="admin-service-primary" disabled={isPending}>
          {isPending ? <Spinner /> : <Plus aria-hidden="true" />}
          {isPending ? "Criando serviço" : "Adicionar serviço"}
        </Button>
      </div>
    </form>
  );
}

export function ServiceManager({ service }: { service: ManagedService }) {
  const router = useRouter();
  const [editState, editAction, isEditPending] = useActionState(
    updateServiceAction,
    initialServiceActionState,
  );
  const [toggleState, toggleAction, isTogglePending] = useActionState(
    toggleServiceAction,
    initialServiceActionState,
  );

  useEffect(() => {
    if (editState.status === "success" || toggleState.status === "success") {
      router.refresh();
    }
  }, [editState, router, toggleState]);

  const toggleForm = (
    <form action={toggleAction}>
      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="nextActive" value={String(!service.active)} />
      <AlertDialogAction type="submit" disabled={isTogglePending}>
        {service.active ? "Confirmar desativação" : "Ativar serviço"}
      </AlertDialogAction>
    </form>
  );

  return (
    <div className="admin-service-actions">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="admin-service-edit-trigger">
            <Pencil aria-hidden="true" /> Editar
          </Button>
        </SheetTrigger>
        <SheetContent className="admin-service-sheet">
          <SheetHeader className="admin-service-sheet-header">
            <p className="admin-page-kicker">Editar serviço</p>
            <SheetTitle>{service.name}</SheetTitle>
            <SheetDescription>
              Alterações não modificam os valores registrados em atendimentos anteriores.
            </SheetDescription>
          </SheetHeader>
          <form action={editAction} className="admin-service-edit-form">
            <input type="hidden" name="serviceId" value={service.id} />
            <ServiceFields service={service} />
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
            data-active={service.active}
            disabled={isTogglePending}
          >
            {service.active ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
            {service.active ? "Desativar" : "Ativar"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="admin-service-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {service.active ? "Desativar este serviço?" : "Ativar este serviço?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {service.active
                ? "Ele deixará de estar disponível para novos agendamentos, mas permanecerá associado ao histórico existente."
                : "O serviço voltará a ficar disponível para novos agendamentos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            {toggleForm}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toggleState.message ? (
        <span className="sr-only" aria-live="polite">
          {toggleState.message}
        </span>
      ) : null}
    </div>
  );
}

export function ServiceCatalogRow({
  service,
  index,
}: {
  service: ManagedService;
  index: number;
}) {
  return (
    <li data-active={service.active}>
      <span className="admin-service-index">{String(index + 1).padStart(2, "0")}</span>
      <div className="admin-service-identity">
        <span>Serviço</span>
        <strong>{service.name}</strong>
        <small>{service.description || "Sem descrição cadastrada."}</small>
      </div>
      <div className="admin-service-fact">
        <span>Duração</span>
        <strong>{formatDuration(service.durationMinutes)}</strong>
      </div>
      <div className="admin-service-fact">
        <span>Preço</span>
        <strong>{currencyFormatter.format(service.priceInCents / 100)}</strong>
      </div>
      <span className="admin-service-status" data-active={service.active}>
        {service.active ? "Ativo" : "Inativo"}
      </span>
      <ServiceManager service={service} />
    </li>
  );
}
