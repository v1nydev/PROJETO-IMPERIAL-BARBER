"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings2,
  UsersRound,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AdministrativeActor } from "@/lib/auth/admin";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  {
    href: "/admin/agendamentos",
    label: "Agendamentos",
    icon: CalendarRange,
  },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors },
  {
    href: "/admin/profissionais",
    label: "Profissionais",
    icon: UsersRound,
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    icon: Settings2,
  },
] as const;

const pageTitles: ReadonlyMap<string, string> = new Map(
  navigation.map((item) => [item.href, item.label]),
);

type AdminShellProps = {
  actor: AdministrativeActor;
  children: ReactNode;
};

function AdminNavigation({ pathname }: { pathname: string }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
              className="admin-sidebar-nav-item"
            >
              <Link href={item.href} onClick={() => setOpenMobile(false)}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function getInitials(email: string) {
  const account = email.split("@")[0] ?? "IB";
  const parts = account.split(/[._-]+/).filter(Boolean);
  const initials = parts.map((part) => part[0]).join("").slice(0, 2);

  return initials.toUpperCase() || "IB";
}

export function AdminShell({ actor, children }: AdminShellProps) {
  const pathname = usePathname();
  const title = pageTitles.get(pathname) ?? "Painel";
  const roleLabel = actor.role === "admin" ? "Administrador" : "Profissional";

  return (
    <SidebarProvider
      className="admin-shell"
      style={{ "--sidebar-width": "17.5rem" } as CSSProperties}
    >
      <Sidebar collapsible="icon" className="admin-sidebar">
        <SidebarHeader className="admin-sidebar-header">
          <Link href="/admin" className="admin-panel-brand">
            <span className="admin-panel-monogram" aria-hidden="true">
              IB
            </span>
            <span className="admin-panel-brand-copy">
              <strong>Imperial</strong>
              <small>Barber · Gestão</small>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operação</SidebarGroupLabel>
            <SidebarGroupContent>
              <AdminNavigation pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <span className="admin-user-initials" aria-hidden="true">
              {getInitials(actor.email)}
            </span>
            <span className="admin-user-copy">
              <strong>{roleLabel}</strong>
              <small>{actor.email}</small>
            </span>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                className="admin-sidebar-logout"
                aria-label="Sair da conta"
                title="Sair da conta"
              >
                <LogOut aria-hidden="true" />
              </Button>
            </form>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="admin-panel-inset">
        <header className="admin-panel-header">
          <div className="admin-header-leading">
            <SidebarTrigger
              className="admin-sidebar-trigger"
              aria-label="Abrir ou recolher navegação"
            />
            <span className="admin-header-divider" aria-hidden="true" />
            <div>
              <p>Painel administrativo</p>
              <strong>{title}</strong>
            </div>
          </div>

          <div className="admin-header-account">
            <span className="admin-user-initials" aria-hidden="true">
              {getInitials(actor.email)}
            </span>
            <span>
              <strong>{roleLabel}</strong>
              <small>{actor.email}</small>
            </span>
          </div>
        </header>

        <div className="admin-panel-content">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
