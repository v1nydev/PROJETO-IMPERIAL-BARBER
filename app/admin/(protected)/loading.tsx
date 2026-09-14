import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPanelLoading() {
  return (
    <div className="admin-page" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando painel</span>
      <div className="admin-loading-heading">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <div className="admin-loading-workspace">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}
