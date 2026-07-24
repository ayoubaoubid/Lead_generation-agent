import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { DomainError } from "@/domain/errors/domain-error";
import type { PermissionKey } from "@/domain/members/permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import { requireAllPermissions } from "@/services/authorization/permission.service";
import {
  resolveUserTenantContext,
  type RequestedTenantLocator,
} from "@/services/tenancy/resolve-tenant-context.service";

export const ACTIVE_AGENCY_COOKIE_NAME = "active_agency_id";
export const ACTIVE_CLIENT_COOKIE_NAME = "active_client_id";

const tenantIdSchema = z.uuid();

export async function resolveRequestedServerTenant(
  locator: RequestedTenantLocator,
  requiredPermissions?: PermissionKey | readonly PermissionKey[],
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new DomainError(
      "authentication_required",
      "Vous devez être connecté pour continuer.",
    );
  }

  const repository = new SupabaseTenantAccessRepository(supabase);
  const tenant = await resolveUserTenantContext(locator, user.id, repository);

  const permissions = requiredPermissions
    ? typeof requiredPermissions === "string"
      ? [requiredPermissions]
      : requiredPermissions
    : [];

  if (permissions.length > 0) {
    await requireAllPermissions(tenant, permissions, repository);
  }

  return { supabase, tenant, user };
}

export async function resolveActiveAgencyTenant(
  requiredPermissions?: PermissionKey | readonly PermissionKey[],
) {
  const cookieStore = await cookies();
  const parsedAgencyId = tenantIdSchema.safeParse(
    cookieStore.get(ACTIVE_AGENCY_COOKIE_NAME)?.value,
  );

  if (!parsedAgencyId.success) {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez une agence active pour continuer.",
    );
  }

  return resolveRequestedServerTenant(
    { agencyId: parsedAgencyId.data },
    requiredPermissions,
  );
}

export async function resolveActiveClientTenant(
  requiredPermissions?: PermissionKey | readonly PermissionKey[],
) {
  const cookieStore = await cookies();
  const parsedAgencyId = tenantIdSchema.safeParse(
    cookieStore.get(ACTIVE_AGENCY_COOKIE_NAME)?.value,
  );
  const parsedClientId = tenantIdSchema.safeParse(
    cookieStore.get(ACTIVE_CLIENT_COOKIE_NAME)?.value,
  );

  if (!parsedAgencyId.success || !parsedClientId.success) {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez une agence et un client actifs pour continuer.",
    );
  }

  const result = await resolveRequestedServerTenant(
    {
      agencyId: parsedAgencyId.data,
      clientId: parsedClientId.data,
    },
    requiredPermissions,
  );

  if (result.tenant.scope !== "client") {
    throw new DomainError(
      "tenant_mismatch",
      "Le contexte client demandé n’est pas accessible.",
    );
  }

  return { ...result, tenant: result.tenant };
}

export async function setActiveAgencyCookie(agencyId: string): Promise<void> {
  const parsedAgencyId = tenantIdSchema.parse(agencyId);
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_AGENCY_COOKIE_NAME, parsedAgencyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearActiveClientCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CLIENT_COOKIE_NAME);
}

export async function clearActiveClientCookieIfMatches(
  clientId: string,
): Promise<void> {
  const parsedClientId = tenantIdSchema.parse(clientId);
  const cookieStore = await cookies();

  if (cookieStore.get(ACTIVE_CLIENT_COOKIE_NAME)?.value === parsedClientId) {
    cookieStore.delete(ACTIVE_CLIENT_COOKIE_NAME);
  }
}

export async function setActiveClientCookie(clientId: string): Promise<void> {
  const parsedClientId = tenantIdSchema.parse(clientId);
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_CLIENT_COOKIE_NAME, parsedClientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
