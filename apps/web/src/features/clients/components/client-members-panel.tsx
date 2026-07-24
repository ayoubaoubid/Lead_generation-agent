"use client";

import { UserPlus, Users } from "lucide-react";
import { useActionState } from "react";

import { Avatar, Button, Card, EmptyState, FormField } from "@/components/ui";
import type {
  AgencyMemberOption,
  ClientMember,
  ClientRoleOption,
} from "@/domain/clients/client";
import { assignClientMemberAction } from "@/features/members/member.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function ClientMembersPanel({
  canAssign,
  canRead,
  clientId,
  members,
  membershipOptions,
}: Readonly<{
  canAssign: boolean;
  canRead: boolean;
  clientId: string;
  members: readonly ClientMember[];
  membershipOptions: Readonly<{
    members: readonly AgencyMemberOption[];
    roles: readonly ClientRoleOption[];
  }>;
}>) {
  const [state, formAction, pending] = useActionState(
    assignClientMemberAction,
    initialTenantActionState,
  );

  return (
    <Card className="client-members-panel">
      <div className="client-panel-heading">
        <div>
          <p className="ui-eyebrow">Accès</p>
          <h2>Membres du client</h2>
        </div>
        <span className="client-member-count">
          <Users aria-hidden size={14} />
          {canRead ? members.length : "—"}
        </span>
      </div>

      {!canRead ? (
        <p className="client-restricted-copy">
          Vous n’avez pas la permission de consulter les membres de cet espace.
        </p>
      ) : members.length === 0 ? (
        <EmptyState
          description="Aucun membre n’est encore affecté à ce client."
          icon={<Users aria-hidden size={20} />}
          title="Équipe non configurée"
        />
      ) : (
        <ul className="client-member-list">
          {members.map((member) => (
            <li key={member.id}>
              <Avatar
                name={member.displayName}
                size="sm"
                {...(member.avatarUrl ? { src: member.avatarUrl } : {})}
              />
              <span>
                <strong>{member.displayName}</strong>
                <small>{member.roleName}</small>
              </span>
              <em>{member.status === "active" ? "Actif" : "Invité"}</em>
            </li>
          ))}
        </ul>
      )}

      {canAssign ? (
        <form action={formAction} className="client-member-form">
          <input name="clientId" type="hidden" value={clientId} />
          <FormField
            error={state.fieldErrors?.profileId?.[0]}
            htmlFor="member-profile"
            label="Membre de l’agence"
          >
            <select
              className="ui-input client-native-select"
              defaultValue=""
              id="member-profile"
              name="profileId"
              required
            >
              <option disabled value="">
                Sélectionner un membre
              </option>
              {membershipOptions.members.map((member) => (
                <option key={member.profileId} value={member.profileId}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            error={state.fieldErrors?.roleId?.[0]}
            htmlFor="member-role"
            label="Rôle client"
          >
            <select
              className="ui-input client-native-select"
              defaultValue=""
              id="member-role"
              name="roleId"
              required
            >
              <option disabled value="">
                Sélectionner un rôle
              </option>
              {membershipOptions.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </FormField>
          {state.message ? (
            <p
              className={`client-form-message client-form-message--${state.status}`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          ) : null}
          <Button
            disabled={
              membershipOptions.members.length === 0 ||
              membershipOptions.roles.length === 0
            }
            iconLeading={<UserPlus aria-hidden size={15} />}
            loading={pending}
            size="sm"
            type="submit"
            variant="secondary"
          >
            Affecter
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
