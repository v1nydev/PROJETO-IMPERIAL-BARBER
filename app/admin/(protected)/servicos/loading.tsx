import { Skeleton } from "@/components/ui/skeleton";

export default function AdminServicesLoading() {
  return (
    <div className="admin-page admin-management-loading" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando serviços</span>
      <div className="admin-loading-heading">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <div className="admin-management-loading-summary">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <div className="admin-management-loading-list">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}
