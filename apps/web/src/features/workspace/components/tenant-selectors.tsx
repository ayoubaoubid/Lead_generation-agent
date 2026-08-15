"use client";

import { Building2, LoaderCircle, Plus, UserRoundSearch } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef } from "react";

import { selectActiveAgencyAction } from "@/features/agency/agency.actions";
import { selectActiveClientAction } from "@/features/clients/client.actions";
import type {
  WorkspaceOption,
  WorkspaceShellContext,
} from "@/features/workspace/workspace-shell-context.service";
import { initialTenantActionState } from "@/types/tenant-action-state";

type TenantSelectorProps = Readonly<{
  context: Pick<
    WorkspaceShellContext,
    "activeAgencyId" | "activeClientId" | "agencies" | "clients"
  >;
  compact?: boolean;
}>;

function Selector({
  activeId,
  ariaLabel,
  disabled,
  icon,
  name,
  onSubmit,
  options,
  pending,
  placeholder,
}: Readonly<{
  activeId: string | undefined;
  ariaLabel: string;
  disabled: boolean;
  icon: React.ReactNode;
  name: "agencyId" | "clientId";
  onSubmit: (payload: FormData) => void;
  options: readonly WorkspaceOption[];
  pending: boolean;
  placeholder: string;
}>) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={onSubmit} className="workspace-tenant-form" ref={formRef}>
      <span className="workspace-tenant-icon" aria-hidden>
        {pending ? <LoaderCircle className="ui-spin" size={15} /> : icon}
      </span>
      <select
        aria-label={ariaLabel}
        className="workspace-tenant-select"
        defaultValue={activeId ?? ""}
        disabled={disabled || pending}
        key={activeId ?? "unselected"}
        name={name}
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option disabled value="">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </form>
  );
}

export function TenantSelectors({
  compact = false,
  context,
}: TenantSelectorProps) {
  const [agencyState, agencyAction, agencyPending] = useActionState(
    selectActiveAgencyAction,
    initialTenantActionState,
  );
  const [clientState, clientAction, clientPending] = useActionState(
    selectActiveClientAction,
    initialTenantActionState,
  );
  const message =
    agencyState.status === "error"
      ? agencyState.message
      : clientState.status === "error"
        ? clientState.message
        : undefined;

  return (
    <div
      className={
        compact
          ? "workspace-tenant-selectors workspace-tenant-selectors--compact"
          : "workspace-tenant-selectors"
      }
    >
      {context.agencies.length === 0 ? (
        <Link className="workspace-create-agency-link" href="/agency/new">
          <Plus aria-hidden size={14} />
          Créer une agence
        </Link>
      ) : (
        <Selector
          activeId={context.activeAgencyId}
          ariaLabel="Agence active"
          disabled={false}
          icon={<Building2 size={15} />}
          name="agencyId"
          onSubmit={agencyAction}
          options={context.agencies}
          pending={agencyPending}
          placeholder="Choisir une agence"
        />
      )}
      <span className="workspace-tenant-divider" aria-hidden />
      <Selector
        activeId={context.activeClientId}
        ariaLabel="Client actif"
        disabled={!context.activeAgencyId || context.clients.length === 0}
        icon={<UserRoundSearch size={15} />}
        name="clientId"
        onSubmit={clientAction}
        options={context.clients}
        pending={clientPending}
        placeholder={
          !context.activeAgencyId
            ? "Agence requise"
            : context.clients.length === 0
              ? "Aucun client"
              : "Choisir un client"
        }
      />
      {message ? (
        <p className="workspace-tenant-error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
