import { Spinner } from "@/components/ui/spinner";

export default function AdminLoading() {
  return (
    <main className="admin-loading" aria-live="polite">
      <Spinner />
      <span>Verificando acesso</span>
    </main>
  );
}
