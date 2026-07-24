import type { PermissionKey } from "@/domain/members/permission";

export interface TenantAccessRepository {
  hasActiveAgencyMembership(
    actorId: string,
    agencyId: string,
  ): Promise<boolean>;
  canAccessClient(
    actorId: string,
    agencyId: string,
    clientId: string,
  ): Promise<boolean>;
  hasPermission(
    actorId: string,
    agencyId: string,
    clientId: string | null,
    permission: PermissionKey,
  ): Promise<boolean>;
  listPermissions(
    actorId: string,
    agencyId: string,
    clientId: string | null,
  ): Promise<PermissionKey[]>;
}
