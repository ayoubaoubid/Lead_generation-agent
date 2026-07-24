"use client";

import {
  Bell,
  ChevronDown,
  CircleUserRound,
  Command,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";

import {
  getWorkspaceBreadcrumbs,
  getWorkspaceSection,
  getWorkspaceSectionByPath,
  workspaceNavigationGroups,
} from "@/config/workspace-navigation";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogClose,
  Drawer,
  EmptyState,
  Input,
} from "@/components/ui";
import { signOutAction } from "@/features/auth/auth.actions";
import type { WorkspaceShellContext } from "@/features/workspace/workspace-shell-context.service";

import { TenantSelectors } from "./tenant-selectors";

type ApplicationShellProps = Readonly<{
  children: ReactNode;
  context: WorkspaceShellContext;
}>;

function Brand() {
  return (
    <Link className="workspace-brand" href="/dashboard">
      <span className="workspace-brand-mark" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="workspace-brand-copy">
        <strong>Lead Operations</strong>
        <small>Agency workspace</small>
      </span>
    </Link>
  );
}

function SidebarNavigation({
  closeOnNavigate = false,
  pathname,
}: Readonly<{ closeOnNavigate?: boolean; pathname: string }>) {
  return (
    <nav aria-label="Navigation principale" className="workspace-nav">
      {workspaceNavigationGroups.map((group) => (
        <div className="workspace-nav-group" key={group.label}>
          <p>{group.label}</p>
          <div>
            {group.sectionKeys.map((key) => {
              const section = getWorkspaceSection(key);
              const active =
                pathname === section.href ||
                pathname.startsWith(`${section.href}/`);
              const Icon = section.icon;
              const link = (
                <Link
                  aria-current={active ? "page" : undefined}
                  className="workspace-nav-link"
                  href={section.href}
                >
                  <Icon aria-hidden size={17} strokeWidth={1.8} />
                  <span>{section.label}</span>
                </Link>
              );

              return closeOnNavigate ? (
                <DialogClose asChild key={section.key}>
                  {link}
                </DialogClose>
              ) : (
                <span key={section.key}>{link}</span>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Sidebar({
  context,
  mobile = false,
  pathname,
}: Readonly<{
  context: WorkspaceShellContext;
  mobile?: boolean;
  pathname: string;
}>) {
  return (
    <div className="workspace-sidebar-inner">
      <Brand />
      {mobile ? (
        <div className="workspace-mobile-tenants">
          <TenantSelectors compact context={context} />
        </div>
      ) : null}
      <SidebarNavigation closeOnNavigate={mobile} pathname={pathname} />
      <div className="workspace-sidebar-foot">
        <span className="workspace-environment-dot" aria-hidden />
        <div>
          <strong>Workspace sécurisé</strong>
          <span>Contexte isolé par tenant</span>
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({ pathname }: Readonly<{ pathname: string }>) {
  const breadcrumbs = getWorkspaceBreadcrumbs(pathname);

  return (
    <nav aria-label="Fil d’Ariane" className="workspace-breadcrumbs">
      <ol>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.label}>
            {breadcrumb.href ? (
              <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
            ) : (
              <span aria-current="page">{breadcrumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SearchLauncher() {
  return (
    <Dialog
      description="La structure de recherche est prête. L’index métier sera connecté dans une phase ultérieure."
      title="Recherche globale"
      trigger={
        <button
          aria-label="Ouvrir la recherche globale"
          className="workspace-search-trigger"
          type="button"
        >
          <Search aria-hidden size={16} />
          <span>Rechercher dans le workspace</span>
          <kbd>
            <Command aria-hidden size={11} /> K
          </kbd>
        </button>
      }
    >
      <div className="workspace-search-panel">
        <Input
          aria-label="Recherche globale indisponible"
          disabled
          placeholder="Entreprises, contacts, campagnes…"
        />
        <EmptyState
          description="Aucun index de recherche n’est activé pour le moment."
          title="Recherche en préparation"
        />
      </div>
    </Dialog>
  );
}

function NotificationsLauncher() {
  return (
    <Drawer
      description="Les alertes opérationnelles et demandes de validation seront regroupées ici."
      title="Notifications"
      trigger={
        <Button
          aria-label="Ouvrir les notifications"
          className="workspace-icon-button"
          size="icon"
          variant="ghost"
        >
          <Bell aria-hidden size={18} />
        </Button>
      }
    >
      <div className="workspace-notifications-panel">
        <Badge tone="neutral">Centre préparé</Badge>
        <EmptyState
          description="Aucune notification réelle n’est disponible pour ce workspace."
          title="Vous êtes à jour"
        />
      </div>
    </Drawer>
  );
}

function UserMenu({ user }: Readonly<{ user: WorkspaceShellContext["user"] }>) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={`Ouvrir le menu de ${user.displayName}`}
          className="workspace-user-trigger"
          type="button"
        >
          <Avatar
            name={user.displayName}
            size="sm"
            {...(user.avatarUrl ? { src: user.avatarUrl } : {})}
          />
          <span>
            <strong>{user.displayName}</strong>
            <small>{user.email}</small>
          </span>
          <ChevronDown aria-hidden size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="ui-popover workspace-user-menu"
          sideOffset={8}
        >
          <DropdownMenu.Label className="workspace-user-menu-label">
            <CircleUserRound aria-hidden size={16} />
            <span>
              <strong>{user.displayName}</strong>
              <small>{user.email}</small>
            </span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="ui-menu-separator" />
          <DropdownMenu.Item asChild>
            <Link className="ui-menu-item" href="/account/profile">
              <UserRound aria-hidden size={15} />
              Mon profil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link className="ui-menu-item" href="/settings">
              <Settings aria-hidden size={15} />
              Paramètres
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="ui-menu-separator" />
          <form action={signOutAction}>
            <DropdownMenu.Item asChild>
              <button
                className="ui-menu-item ui-menu-item--danger workspace-signout"
                type="submit"
              >
                <LogOut aria-hidden size={15} />
                Se déconnecter
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ApplicationShell({ children, context }: ApplicationShellProps) {
  const pathname = usePathname();
  const currentSection = getWorkspaceSectionByPath(pathname);

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Sidebar context={context} pathname={pathname} />
      </aside>
      <div className="workspace-stage">
        <header className="workspace-topbar">
          <div className="workspace-topbar-leading">
            <Drawer
              description="Accédez aux modules du workspace."
              side="left"
              title="Navigation"
              trigger={
                <Button
                  aria-label="Ouvrir la navigation"
                  className="workspace-mobile-menu"
                  size="icon"
                  variant="ghost"
                >
                  <Menu aria-hidden size={19} />
                </Button>
              }
            >
              <Sidebar context={context} mobile pathname={pathname} />
            </Drawer>
            <div>
              <Breadcrumbs pathname={pathname} />
              <strong className="workspace-current-section">
                {currentSection?.label ?? "Lead Operations"}
              </strong>
            </div>
          </div>
          <div className="workspace-topbar-tenants">
            <TenantSelectors context={context} />
          </div>
          <div className="workspace-topbar-actions">
            <SearchLauncher />
            <NotificationsLauncher />
            <UserMenu user={context.user} />
          </div>
        </header>
        <main className="workspace-main" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
