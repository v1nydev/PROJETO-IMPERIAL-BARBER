"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin, Save, Store, Text } from "lucide-react";
import {
  initialSettingsActionState,
  updateShopSettingsAction,
} from "@/app/admin/(protected)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { ShopSettings } from "@/lib/data/settings";

export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(
    updateShopSettingsAction,
    initialSettingsActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={action} className="admin-settings-form">
      <fieldset className="admin-settings-section">
        <legend>
          <Store aria-hidden="true" />
          <span><small>Identidade e contato</small>Informações principais</span>
        </legend>

        <div className="admin-settings-fields">
          <div className="admin-settings-field is-wide">
            <Label htmlFor="settings-name">Nome da barbearia</Label>
            <Input
              id="settings-name"
              name="name"
              defaultValue={settings.name}
              minLength={2}
              maxLength={120}
              required
            />
          </div>
          <div className="admin-settings-field">
            <Label htmlFor="settings-phone">Telefone</Label>
            <Input
              id="settings-phone"
              name="phone"
              type="tel"
              defaultValue={settings.phone}
              minLength={8}
              maxLength={40}
              required
            />
          </div>
          <div className="admin-settings-field">
            <Label htmlFor="settings-whatsapp">WhatsApp</Label>
            <Input
              id="settings-whatsapp"
              name="whatsapp"
              type="tel"
              defaultValue={settings.whatsapp}
              minLength={8}
              maxLength={40}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-settings-section">
        <legend>
          <MapPin aria-hidden="true" />
          <span><small>Presença física</small>Local e funcionamento</span>
        </legend>

        <div className="admin-settings-fields">
          <div className="admin-settings-field">
            <Label htmlFor="settings-address">Endereço</Label>
            <Textarea
              id="settings-address"
              name="address"
              defaultValue={settings.address}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
          <div className="admin-settings-field">
            <Label htmlFor="settings-hours">
              <Clock3 aria-hidden="true" /> Horário geral de funcionamento
            </Label>
            <Textarea
              id="settings-hours"
              name="openingHours"
              defaultValue={settings.openingHours}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-settings-section">
        <legend>
          <Text aria-hidden="true" />
          <span><small>Apresentação</small>Sobre o estabelecimento</span>
        </legend>

        <div className="admin-settings-field">
          <Label htmlFor="settings-description">Descrição institucional</Label>
          <Textarea
            id="settings-description"
            name="description"
            defaultValue={settings.description}
            maxLength={1000}
          />
        </div>
      </fieldset>

      <footer className="admin-settings-footer">
        <div>
          {state.message ? (
            <p className="admin-service-feedback" data-status={state.status} role="status">
              {state.message}
            </p>
          ) : (
            <p>As alterações ficam disponíveis para as interfaces conectadas.</p>
          )}
        </div>
        <Button type="submit" className="admin-settings-save" disabled={isPending}>
          {isPending ? <Spinner /> : <Save aria-hidden="true" />}
          {isPending ? "Salvando configurações" : "Salvar configurações"}
        </Button>
      </footer>
    </form>
  );
}
