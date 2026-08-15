"use client";

import { MailPlus, UserRoundCog, UsersRound } from "lucide-react";
import { useActionState } from "react";

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
} from "@/components/ui";
import {
  assignRecruiterClientsAction,
  inviteRecruiterAction,
} from "@/features/agency/agency.actions";
import type {
  AgencyManagementData,
  RecruiterManagementItem,
} from "@/features/agency/agency.queries";
import { initialTenantActionState } from "@/types/tenant-action-state";

function ClientChoices({
  clients,
  disabledClientIds = [],
  legend,
}: Readonly<{
  clients: AgencyManagementData["clients"];
  disabledClientIds?: readonly string[];
  legend: string;
}>) {
  const disabledIds = new Set(disabledClientIds);

  if (clients.length === 0) {
    return (
      <p className="agency-client-choice-empty">
        Créez d’abord un client pour préparer une affectation.
      </p>
    );
  }

  return (
    <fieldset className="agency-client-choices">
      <legend>{legend}</legend>
      <div>
        {clients.map((client) => {
          const disabled = disabledIds.has(client.id);
          return (
            <label key={client.id}>
              <input
                defaultChecked={disabled}
                disabled={disabled}
                name="clientIds"
                type="checkbox"
                value={client.id}
              />
              <span>{client.name}</span>
              {disabled ? <small>Déjà affecté</small> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function RecruiterStatus({
  status,
}: Readonly<{ status: RecruiterManagementItem["status"] }>) {
  const label =
    status === "active"
      ? "Actif"
      : status === "invited"
        ? "Invitation envoyée"
        : status === "suspended"
          ? "Suspendu"
          : "Retiré";

  return (
    <Badge tone={status === "active" ? "success" : "neutral"}>{label}</Badge>
  );
}

function ExistingRecruiterAssignment({
  clients,
  recruiter,
}: Readonly<{
  clients: AgencyManagementData["clients"];
  recruiter: RecruiterManagementItem;
}>) {
  const [state, formAction, pending] = useActionState(
    assignRecruiterClientsAction,
    initialTenantActionState,
  );

  return (
    <li className="agency-recruiter-row">
      <div className="agency-recruiter-identity">
        <Avatar name={recruiter.displayName} size="sm" />
        <span>
          <strong>{recruiter.displayName}</strong>
          <small>{recruiter.email ?? "Email masqué"}</small>
        </span>
        <RecruiterStatus status={recruiter.status} />
      </div>

      <div className="agency-assignment-summary">
        {recruiter.clients.length === 0 ? (
          <span>Aucun client affecté</span>
        ) : (
          recruiter.clients.map((client) => (
            <Badge key={client.id} tone="brand">
              {client.name}
            </Badge>
          ))
        )}
      </div>

      {recruiter.status === "active" ? (
        <form action={formAction} className="agency-inline-assignment">
          <input name="profileId" type="hidden" value={recruiter.profileId} />
          <ClientChoices
            clients={clients}
            disabledClientIds={recruiter.clients.map((client) => client.id)}
            legend="Ajouter des accès clients"
          />
          {state.message ? (
            <p
              className={`agency-action-message agency-action-message--${state.status}`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          ) : null}
          <Button
            disabled={pending || recruiter.clients.length === clients.length}
            iconLeading={<UserRoundCog aria-hidden size={15} />}
            loading={pending}
            size="sm"
            type="submit"
            variant="secondary"
          >
            Ajouter les accès
          </Button>
        </form>
      ) : null}
    </li>
  );
}

export function RecruiterManagementPanel({
  data,
}: Readonly<{ data: AgencyManagementData }>) {
  const [state, formAction, pending] = useActionState(
    inviteRecruiterAction,
    initialTenantActionState,
  );

  if (!data.canManageRecruiters) {
    return (
      <Card>
        <EmptyState
          description="Seul l’Agency Owner peut inviter et affecter des Recruiters."
          icon={<UsersRound aria-hidden size={20} />}
          title="Administration réservée"
        />
      </Card>
    );
  }

  return (
    <div className="agency-management-grid">
      <Card className="agency-invite-card">
        <div className="agency-card-heading">
          <span className="agency-card-icon" aria-hidden>
            <MailPlus size={20} />
          </span>
          <div>
            <h2>Inviter un Recruiter</h2>
            <p>
              L’utilisateur rejoindra l’agence et ne verra que les clients
              sélectionnés.
            </p>
          </div>
        </div>

        <form action={formAction} className="agency-invite-form" noValidate>
          <FormField
            error={state.fieldErrors?.email?.[0]}
            htmlFor="recruiter-email"
            label="Adresse email"
          >
            <Input
              autoComplete="email"
              id="recruiter-email"
              invalid={Boolean(state.fieldErrors?.email)}
              name="email"
              placeholder="recruiter@agence.com"
              required
              type="email"
            />
          </FormField>
          <ClientChoices
            clients={data.clients}
            legend="Clients accessibles dès l’activation"
          />
          {state.message ? (
            <p
              className={`agency-action-message agency-action-message--${state.status}`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          ) : null}
          <Button
            iconLeading={<MailPlus aria-hidden size={15} />}
            loading={pending}
            type="submit"
          >
            Envoyer l’invitation
          </Button>
        </form>
      </Card>

      <Card className="agency-team-card">
        <div className="agency-card-heading">
          <span className="agency-card-icon" aria-hidden>
            <UsersRound size={20} />
          </span>
          <div>
            <h2>Équipe Recruiters</h2>
            <p>{data.recruiters.length} membre(s) opérationnel(s)</p>
          </div>
        </div>

        {data.recruiters.length === 0 ? (
          <EmptyState
            description="Invitez votre premier Recruiter et choisissez les clients qu’il pourra gérer."
            icon={<UsersRound aria-hidden size={20} />}
            title="Aucun Recruiter"
          />
        ) : (
          <ul className="agency-recruiter-list">
            {data.recruiters.map((recruiter) => (
              <ExistingRecruiterAssignment
                clients={data.clients}
                key={recruiter.profileId}
                recruiter={recruiter}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
