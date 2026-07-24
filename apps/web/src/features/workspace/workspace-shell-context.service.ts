import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/auth-session.service";
import {
  ACTIVE_AGENCY_COOKIE_NAME,
  ACTIVE_CLIENT_COOKIE_NAME,
} from "@/lib/tenancy/server-tenant-context";

export type WorkspaceOption = Readonly<{
  id: string;
  name: string;
}>;

export type WorkspaceShellContext = Readonly<{
  user: Readonly<{
    displayName: string;
    email: string;
    avatarUrl?: string;
  }>;
  agencies: readonly WorkspaceOption[];
  clients: readonly WorkspaceOption[];
  activeAgencyId?: string;
  activeClientId?: string;
}>;

const idSchema = z.uuid();

function validCookieId(value: string | undefined): string | undefined {
  const result = idSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export async function getWorkspaceShellContext(): Promise<WorkspaceShellContext> {
  const { supabase, user } = await requireAuthenticatedUser();

  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("agency_members")
      .select("agency_id")
      .eq("profile_id", user.id)
      .eq("status", "active"),
  ]);

  const agencyIds = membershipsResult.error
    ? []
    : [...new Set(membershipsResult.data.map((row) => row.agency_id))];
  const agenciesResult =
    agencyIds.length > 0
      ? await supabase
          .from("agencies")
          .select("id, name")
          .in("id", agencyIds)
          .neq("status", "archived")
          .order("name")
      : { data: [], error: null };
  const agencies = agenciesResult.error ? [] : agenciesResult.data;

  const cookieStore = await cookies();
  const requestedAgencyId = validCookieId(
    cookieStore.get(ACTIVE_AGENCY_COOKIE_NAME)?.value,
  );
  const activeAgencyId = agencies.some(
    (agency) => agency.id === requestedAgencyId,
  )
    ? requestedAgencyId
    : undefined;

  const clientsResult = activeAgencyId
    ? await supabase
        .from("clients")
        .select("id, name")
        .eq("agency_id", activeAgencyId)
        .neq("status", "archived")
        .order("name")
    : { data: [], error: null };
  const clients = clientsResult.error ? [] : clientsResult.data;

  const requestedClientId = validCookieId(
    cookieStore.get(ACTIVE_CLIENT_COOKIE_NAME)?.value,
  );
  const activeClientId = clients.some(
    (client) => client.id === requestedClientId,
  )
    ? requestedClientId
    : undefined;
  const profile = profileResult.error ? null : profileResult.data;
  const fallbackName = user.email?.split("@")[0] || "Utilisateur";

  return {
    user: {
      displayName: profile?.display_name?.trim() || fallbackName,
      email: user.email || "Compte Supabase",
      ...(profile?.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
    },
    agencies,
    clients,
    ...(activeAgencyId ? { activeAgencyId } : {}),
    ...(activeClientId ? { activeClientId } : {}),
  };
}
