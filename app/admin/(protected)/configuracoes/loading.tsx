import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="admin-page admin-settings-loading" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando configurações</span>
      <div className="admin-loading-heading">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
      <div className="admin-settings-loading-body">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}
