"use client";

import { useActionState } from "react";
import { CircleAlert, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  initialLoginState,
  loginAction,
} from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialLoginState,
  );

  return (
    <form action={formAction} className="admin-login-form" noValidate>
      <div className="admin-field">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="voce@imperialbarber.com.br"
          required
          disabled={isPending}
        />
      </div>

      <div className="admin-field">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          required
          disabled={isPending}
        />
      </div>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive" className="admin-auth-alert">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="admin-login-submit"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner /> Verificando acesso
          </>
        ) : (
          <>
            Entrar no painel <LogIn aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
