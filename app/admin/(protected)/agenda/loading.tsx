import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAgendaLoading() {
  return (
    <div className="admin-page admin-agenda-loading" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando agenda</span>
      <div className="admin-loading-heading">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <div className="admin-agenda-loading-filters">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <div className="admin-agenda-loading-list">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}
