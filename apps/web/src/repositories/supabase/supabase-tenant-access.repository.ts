import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isPermissionKey,
  type PermissionKey,
} from "@/domain/members/permission";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database } from "@/types/database.generated";

type MembershipRoleRow = Readonly<{ role_id: string }>;

export class SupabaseTenantAccessRepository implements TenantAccessRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async hasActiveAgencyMembership(
    actorId: string,
    agencyId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("agency_members")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("profile_id", actorId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the agency membership.",
        error,
      );
    }

    return data !== null;
  }

  async canAccessClient(
    _actorId: string,
    agencyId: string,
    clientId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("clients")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("id", clientId)
      .maybeSingle();

    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the client membership.",
        error,
      );
    }

    return data !== null;
  }

  async hasPermission(
    actorId: string,
    agencyId: string,
    clientId: string | null,
    permission: PermissionKey,
  ): Promise<boolean> {
    const permissions = await this.listPermissions(actorId, agencyId, clientId);

    return permissions.includes(permission);
  }

  async listPermissions(
    actorId: string,
    agencyId: string,
    clientId: string | null,
  ): Promise<PermissionKey[]> {
    const roleIds = await this.findRoleIds(actorId, agencyId, clientId);

    if (roleIds.length === 0) {
      return [];
    }

    const { data: assignments, error: assignmentError } = await this.supabase
      .from("role_permissions")
      .select("permission_id")
      .in("role_id", roleIds);

    if (assignmentError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the role permissions.",
        assignmentError,
      );
    }

    const permissionIds = [
      ...new Set(assignments.map((assignment) => assignment.permission_id)),
    ];

    if (permissionIds.length === 0) {
      return [];
    }

    const { data: permissions, error: permissionError } = await this.supabase
      .from("permissions")
      .select("key")
      .in("id", permissionIds);

    if (permissionError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the permission catalog.",
        permissionError,
      );
    }

    return permissions
      .map((permission) => permission.key)
      .filter(isPermissionKey)
      .sort();
  }

  private async findRoleIds(
    actorId: string,
    agencyId: string,
    clientId: string | null,
  ): Promise<string[]> {
    const { data: agencyMembership, error: agencyMembershipError } =
      await this.supabase
        .from("agency_members")
        .select("role_id")
        .eq("agency_id", agencyId)
        .eq("profile_id", actorId)
        .eq("status", "active")
        .maybeSingle();

    if (agencyMembershipError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the agency role.",
        agencyMembershipError,
      );
    }

    const roleIds = agencyMembership
      ? [(agencyMembership as MembershipRoleRow).role_id]
      : [];

    if (!clientId) {
      return roleIds;
    }

    const { data: clientMembership, error: clientMembershipError } =
      await this.supabase
        .from("client_members")
        .select("role_id")
        .eq("agency_id", agencyId)
        .eq("client_id", clientId)
        .eq("profile_id", actorId)
        .eq("status", "active")
        .maybeSingle();

    if (clientMembershipError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the client role.",
        clientMembershipError,
      );
    }

    if (clientMembership) {
      roleIds.push((clientMembership as MembershipRoleRow).role_id);
    }

    return [...new Set(roleIds)];
  }
}
