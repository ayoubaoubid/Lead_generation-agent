import "server-only";

import type { PermissionKey } from "@/domain/members/permission";
import {
  resolveActiveAgencyTenant,
  resolveRequestedServerTenant,
} from "@/lib/tenancy/server-tenant-context";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import type { RequestedTenantLocator } from "@/services/tenancy/resolve-tenant-context.service";

export type ServerPermissionSnapshot = Readonly<{
  actorId: string;
  agencyId: string;
  clientId?: string;
  permissions: readonly PermissionKey[];
}>;

export async function getRequestedPermissionSnapshot(
  locator: RequestedTenantLocator,
): Promise<ServerPermissionSnapshot> {
  const { supabase, tenant, user } =
    await resolveRequestedServerTenant(locator);
  const repository = new SupabaseTenantAccessRepository(supabase);
  const permissions = await repository.listPermissions(
    user.id,
    tenant.agencyId,
    tenant.scope === "client" ? tenant.clientId : null,
  );

  return {
    actorId: user.id,
    agencyId: tenant.agencyId,
    ...(tenant.scope === "client" ? { clientId: tenant.clientId } : {}),
    permissions,
  };
}

export async function getActiveAgencyPermissionSnapshot(): Promise<ServerPermissionSnapshot> {
  const { supabase, tenant, user } = await resolveActiveAgencyTenant();
  const repository = new SupabaseTenantAccessRepository(supabase);
  const permissions = await repository.listPermissions(
    user.id,
    tenant.agencyId,
    null,
  );

  return {
    actorId: user.id,
    agencyId: tenant.agencyId,
    permissions,
  };
}
