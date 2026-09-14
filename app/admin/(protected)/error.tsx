"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminPanelError({ reset }: { reset: () => void }) {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <p className="admin-page-kicker">Interrupção temporária</p>
        <h1>Não foi possível abrir esta área.</h1>
      </header>

      <Alert variant="destructive" className="admin-error-state">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>Algo saiu do esperado.</AlertTitle>
        <AlertDescription>
          Tente carregar novamente. Se o problema continuar, volte ao dashboard.
        </AlertDescription>
      </Alert>

      <div className="admin-error-actions">
        <Button type="button" onClick={reset} className="admin-retry-button">
          <RotateCcw aria-hidden="true" /> Tentar novamente
        </Button>
        <Button asChild variant="outline" className="admin-outline-button">
          <Link href="/admin">Voltar ao dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
