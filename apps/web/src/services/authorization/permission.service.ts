import { DomainError } from "@/domain/errors/domain-error";
import type {
  PermissionKey,
  PermissionRequirement,
} from "@/domain/members/permission";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type { TenantContext } from "@/types/tenant-context";

export function hasPermission(
  grantedPermissions: readonly PermissionKey[],
  permission: PermissionKey,
): boolean {
  return grantedPermissions.includes(permission);
}

export function satisfiesPermissionRequirement(
  grantedPermissions: readonly PermissionKey[],
  requirement: PermissionRequirement,
): boolean {
  const granted = new Set(grantedPermissions);
  const hasAll = (requirement.allOf ?? []).every((permission) =>
    granted.has(permission),
  );
  const hasAny =
    !requirement.anyOf ||
    requirement.anyOf.length === 0 ||
    requirement.anyOf.some((permission) => granted.has(permission));

  return hasAll && hasAny;
}

export async function requirePermission(
  context: TenantContext,
  permission: PermissionKey,
  repository: TenantAccessRepository,
): Promise<void> {
  if (context.actor.kind !== "user") {
    throw new DomainError(
      "permission_denied",
      "Cette action n’est pas autorisée.",
    );
  }

  const isGranted = await repository.hasPermission(
    context.actor.actorId,
    context.agencyId,
    context.scope === "client" ? context.clientId : null,
    permission,
  );

  if (!isGranted) {
    throw new DomainError(
      "permission_denied",
      "Cette action n’est pas autorisée.",
    );
  }
}

export async function requireAllPermissions(
  context: TenantContext,
  permissions: readonly PermissionKey[],
  repository: TenantAccessRepository,
): Promise<void> {
  if (context.actor.kind !== "user") {
    throw new DomainError(
      "permission_denied",
      "Cette action n’est pas autorisée.",
    );
  }

  const grantedPermissions = await repository.listPermissions(
    context.actor.actorId,
    context.agencyId,
    context.scope === "client" ? context.clientId : null,
  );

  if (
    !permissions.every((permission) => grantedPermissions.includes(permission))
  ) {
    throw new DomainError(
      "permission_denied",
      "Cette action n’est pas autorisée.",
    );
  }
}

export async function requireAnyPermission(
  context: TenantContext,
  permissions: readonly PermissionKey[],
  repository: TenantAccessRepository,
): Promise<void> {
  if (context.actor.kind !== "user" || permissions.length === 0) {
    throw new DomainError(
      "permission_denied",
      "Cette action n’est pas autorisée.",
    );
  }

  const grantedPermissions = await repository.listPermissions(
    context.actor.actorId,
    context.agencyId,
    context.scope === "client" ? context.clientId : null,
  );

  if (
    permissions.some((permission) => grantedPermissions.includes(permission))
  ) {
    return;
  }

  throw new DomainError(
    "permission_denied",
    "Cette action n’est pas autorisée.",
  );
}
