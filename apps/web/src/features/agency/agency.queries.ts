import "server-only";

import { DomainError } from "@/domain/errors/domain-error";
import type { PermissionKey } from "@/domain/members/permission";
import { getActiveAgencyPermissionSnapshot } from "@/lib/authorization/server-permissions";
import { serverLogger } from "@/lib/logging/server-logger";
import { resolveActiveAgencyTenant } from "@/lib/tenancy/server-tenant-context";
import { listRecruiterEmails } from "@/services/agency/recruiter-invitation.service";

export type RecruiterManagementItem = Readonly<{
  profileId: string;
  displayName: string;
  email?: string;
  status: "invited" | "active" | "suspended" | "removed";
  clients: readonly Readonly<{ id: string; name: string }>[];
}>;

export type AgencyManagementData = Readonly<{
  agency: Readonly<{ id: string; name: string }>;
  canManageRecruiters: boolean;
  clients: readonly Readonly<{ id: string; name: string }>[];
  recruiters: readonly RecruiterManagementItem[];
}>;

const recruiterManagementPermissions = [
  "member.read",
  "member.invite",
  "member.assign_role",
] as const satisfies readonly PermissionKey[];

export async function getAgencyManagementData(): Promise<AgencyManagementData> {
  const { supabase, tenant } = await resolveActiveAgencyTenant();
  const permissionSnapshot = await getActiveAgencyPermissionSnapshot();
  const canManageRecruiters = recruiterManagementPermissions.every(
    (permission) => permissionSnapshot.permissions.includes(permission),
  );

  const [
    { data: agency, error: agencyError },
    { data: clients, error: clientError },
  ] = await Promise.all([
    supabase
      .from("agencies")
      .select("id, name")
      .eq("id", tenant.agencyId)
      .single(),
    supabase
      .from("clients")
      .select("id, name")
      .eq("agency_id", tenant.agencyId)
      .neq("status", "archived")
      .order("name"),
  ]);

  if (agencyError || clientError || !agency) {
    throw new DomainError(
      "external_dependency_failed",
      "Les paramètres de l’agence sont temporairement indisponibles.",
    );
  }

  if (!canManageRecruiters) {
    return { agency, canManageRecruiters, clients, recruiters: [] };
  }

  const { data: recruiterRole, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("agency_id", tenant.agencyId)
    .eq("scope", "agency")
    .eq("slug", "recruiter")
    .is("client_id", null)
    .is("archived_at", null)
    .maybeSingle();

  if (roleError) {
    throw new DomainError(
      "external_dependency_failed",
      "Les rôles de l’agence sont temporairement indisponibles.",
    );
  }

  if (!recruiterRole) {
    return { agency, canManageRecruiters, clients, recruiters: [] };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("agency_members")
    .select("profile_id, status")
    .eq("agency_id", tenant.agencyId)
    .eq("role_id", recruiterRole.id)
    .neq("status", "removed")
    .order("created_at");

  if (membershipError) {
    throw new DomainError(
      "external_dependency_failed",
      "Les membres de l’agence sont temporairement indisponibles.",
    );
  }

  if (memberships.length === 0) {
    return { agency, canManageRecruiters, clients, recruiters: [] };
  }

  const profileIds = memberships.map((membership) => membership.profile_id);
  const [profileResult, clientMembershipResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", profileIds),
    supabase
      .from("client_members")
      .select("client_id, profile_id")
      .eq("agency_id", tenant.agencyId)
      .in("profile_id", profileIds)
      .neq("status", "removed"),
  ]);

  if (profileResult.error || clientMembershipResult.error) {
    throw new DomainError(
      "external_dependency_failed",
      "Les affectations Recruiter sont temporairement indisponibles.",
    );
  }

  let emailByProfileId: ReadonlyMap<string, string> = new Map();
  try {
    emailByProfileId = await listRecruiterEmails(profileIds);
  } catch (error) {
    serverLogger.warn("Recruiter Auth emails could not be listed.", {
      correlationId: crypto.randomUUID(),
      operation: "agency.list_recruiter_emails",
      agencyId: tenant.agencyId,
      actor: {
        kind: "user",
        actorId: permissionSnapshot.actorId,
      },
      attributes: {
        error: error instanceof Error ? error.name : "unknown",
      },
    });
  }

  const profileById = new Map(
    profileResult.data.map((profile) => [profile.id, profile]),
  );
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const assignedClientIds = new Map<string, string[]>();

  clientMembershipResult.data.forEach((membership) => {
    const current = assignedClientIds.get(membership.profile_id) ?? [];
    current.push(membership.client_id);
    assignedClientIds.set(membership.profile_id, current);
  });

  const recruiters = memberships.map((membership) => {
    const profile = profileById.get(membership.profile_id);
    const email = emailByProfileId.get(membership.profile_id);
    const assignedClients = (assignedClientIds.get(membership.profile_id) ?? [])
      .map((clientId) => clientById.get(clientId))
      .filter(
        (client): client is { id: string; name: string } =>
          client !== undefined,
      );

    return {
      profileId: membership.profile_id,
      displayName:
        profile?.display_name?.trim() || email?.split("@")[0] || "Recruiter",
      ...(email ? { email } : {}),
      status: membership.status,
      clients: assignedClients,
    };
  });

  return { agency, canManageRecruiters, clients, recruiters };
}

export async function getAgencyManagementPageData() {
  try {
    return { ok: true as const, data: await getAgencyManagementData() };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof DomainError
          ? error.publicMessage
          : "Les paramètres de l’agence sont temporairement indisponibles.",
    };
  }
}
