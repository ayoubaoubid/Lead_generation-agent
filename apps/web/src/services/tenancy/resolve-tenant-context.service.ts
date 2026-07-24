import { DomainError } from "@/domain/errors/domain-error";
import type { PermissionKey } from "@/domain/members/permission";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { requirePermission } from "@/services/authorization/permission.service";
import type { TenantContext } from "@/types/tenant-context";

export type RequestedTenantLocator = Readonly<{
  agencyId: string;
  clientId?: string;
}>;

export async function resolveUserTenantContext(
  locator: RequestedTenantLocator,
  actorId: string,
  repository: TenantAccessRepository,
): Promise<TenantContext> {
  const hasAgencyMembership = await repository.hasActiveAgencyMembership(
    actorId,
    locator.agencyId,
  );

  if (!hasAgencyMembership) {
    throw new DomainError(
      "tenant_mismatch",
      "Vous n’avez pas accès à cet espace.",
    );
  }

  if (!locator.clientId) {
    return {
      scope: "agency",
      agencyId: locator.agencyId,
      actor: { kind: "user", actorId },
    };
  }

  const canAccessClient = await repository.canAccessClient(
    actorId,
    locator.agencyId,
    locator.clientId,
  );

  if (!canAccessClient) {
    throw new DomainError(
      "tenant_mismatch",
      "Vous n’avez pas accès à cet espace.",
    );
  }

  return {
    scope: "client",
    agencyId: locator.agencyId,
    clientId: locator.clientId,
    actor: { kind: "user", actorId },
  };
}

export async function requireTenantPermission(
  context: TenantContext,
  permission: PermissionKey,
  repository: TenantAccessRepository,
): Promise<void> {
  await requirePermission(context, permission, repository);
}
