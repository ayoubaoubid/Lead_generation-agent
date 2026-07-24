import "server-only";

import { DomainError } from "@/domain/errors/domain-error";
import type { PermissionKey } from "@/domain/members/permission";
import { createServerClientModule } from "@/lib/clients/server-client-module";
import {
  getActiveAgencyPermissionSnapshot,
  getRequestedPermissionSnapshot,
} from "@/lib/authorization/server-permissions";
import {
  resolveActiveAgencyTenant,
  resolveRequestedServerTenant,
} from "@/lib/tenancy/server-tenant-context";
import { clientListQuerySchema } from "@/validations/clients/client.schema";

function hasAllPermissions(
  granted: readonly PermissionKey[],
  required: readonly PermissionKey[],
): boolean {
  return required.every((permission) => granted.includes(permission));
}

export async function getClientListData(
  rawQuery: Readonly<Record<string, string | string[] | undefined>>,
) {
  const query = clientListQuerySchema.parse({
    q: rawQuery.q,
    status: rawQuery.status,
    industry: rawQuery.industry,
    country: rawQuery.country,
    page: rawQuery.page,
  });
  const { supabase, tenant } = await resolveActiveAgencyTenant("client.read");
  const [{ context, service }, permissionSnapshot] = await Promise.all([
    Promise.resolve(createServerClientModule(supabase, tenant)),
    getActiveAgencyPermissionSnapshot(),
  ]);
  const clients = await service.list(
    {
      query: query.q,
      status: query.status,
      industry: query.industry,
      countryCode: query.country,
      page: query.page,
      pageSize: 18,
    },
    context,
  );

  return { clients, query, permissions: permissionSnapshot.permissions };
}

export async function getCreateClientPageData() {
  const permissionSnapshot = await getActiveAgencyPermissionSnapshot();

  return {
    canCreate: permissionSnapshot.permissions.includes("client.create"),
  };
}

export async function getClientDetailData(clientId: string) {
  const { tenant: agencyTenant } = await resolveActiveAgencyTenant();
  const { supabase, tenant } = await resolveRequestedServerTenant(
    {
      agencyId: agencyTenant.agencyId,
      clientId,
    },
    "client.read",
  );
  const [{ context, service }, permissionSnapshot] = await Promise.all([
    Promise.resolve(createServerClientModule(supabase, tenant)),
    getRequestedPermissionSnapshot({
      agencyId: tenant.agencyId,
      clientId,
    }),
  ]);
  const client = await service.find(clientId, context);
  const permissions = permissionSnapshot.permissions;
  const canReadMembers = hasAllPermissions(permissions, [
    "client.read",
    "member.read",
  ]);
  const canAssignMembers = hasAllPermissions(permissions, [
    "member.read",
    "member.invite",
    "member.assign_role",
  ]);

  const [members, membershipOptions] = await Promise.all([
    canReadMembers
      ? service.listMembers(clientId, context)
      : Promise.resolve([]),
    canAssignMembers
      ? service.listMembershipOptions(clientId, context)
      : Promise.resolve({ members: [], roles: [] }),
  ]);

  return {
    client,
    members,
    membershipOptions,
    permissions,
    canManage: permissions.includes("client.manage"),
    canArchive: permissions.includes("client.archive"),
    canReadMembers,
    canAssignMembers,
  };
}

function publicErrorMessage(error: unknown, fallback: string): string {
  return error instanceof DomainError ? error.publicMessage : fallback;
}

export async function getClientListPageData(
  rawQuery: Readonly<Record<string, string | string[] | undefined>>,
) {
  try {
    return { ok: true as const, data: await getClientListData(rawQuery) };
  } catch (error) {
    return {
      ok: false as const,
      message: publicErrorMessage(
        error,
        "Les clients sont temporairement indisponibles.",
      ),
    };
  }
}

export async function getSafeCreateClientPageData() {
  try {
    return { ok: true as const, data: await getCreateClientPageData() };
  } catch (error) {
    return {
      ok: false as const,
      message: publicErrorMessage(
        error,
        "La création de client est temporairement indisponible.",
      ),
    };
  }
}

export async function getClientDetailPageData(clientId: string) {
  try {
    return { ok: true as const, data: await getClientDetailData(clientId) };
  } catch (error) {
    return {
      ok: false as const,
      message: publicErrorMessage(
        error,
        "La fiche client est temporairement indisponible.",
      ),
    };
  }
}
