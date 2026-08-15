import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AgencyMemberOption,
  ClientListItem,
  ClientMember,
  ClientProfile,
  ClientRoleOption,
} from "@/domain/clients/client";
import type {
  ClientPage,
  ClientRepository,
  CreateClientRecord,
  ListClientsFilter,
  UpdateClientRecord,
} from "@/repositories/contracts/client.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database } from "@/types/database.generated";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function mapClient(row: ClientRow): ClientProfile {
  return {
    id: row.id,
    agencyId: row.agency_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    legalName: row.legal_name,
    websiteUrl: row.website_url,
    industry: row.industry,
    countryCode: row.country_code,
    languageCode: row.language_code,
    timezone: row.timezone,
    description: row.description,
    logoUrl: row.logo_url,
    objectives: row.objectives,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
  };
}

function mapClientListItem(row: ClientRow): ClientListItem {
  const client = mapClient(row);
  return {
    id: client.id,
    name: client.name,
    slug: client.slug,
    status: client.status,
    websiteUrl: client.websiteUrl,
    industry: client.industry,
    countryCode: client.countryCode,
    languageCode: client.languageCode,
    logoUrl: client.logoUrl,
    updatedAt: client.updatedAt,
  };
}

function mutationError(error: { code?: string; message: string }): never {
  throw new RepositoryError(
    error.code === "23505" ? "conflict" : "unavailable",
    "Client persistence failed.",
    error,
  );
}

export class SupabaseClientRepository implements ClientRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(
    filter: ListClientsFilter,
    context: RepositoryContext,
  ): Promise<ClientPage> {
    let request = this.supabase
      .from("clients")
      .select("*", { count: "exact" })
      .eq("agency_id", context.tenant.agencyId);

    if (filter.status === "current") {
      request = request.neq("status", "archived");
    } else {
      request = request.eq("status", filter.status);
    }

    if (filter.query) {
      const escapedQuery = filter.query.replace(/[\\%_]/gu, "\\$&");
      request = request.ilike("name", `%${escapedQuery}%`);
    }

    if (filter.industry) {
      const escapedIndustry = filter.industry.replace(/[\\%_]/gu, "\\$&");
      request = request.ilike("industry", `%${escapedIndustry}%`);
    }

    if (filter.countryCode) {
      request = request.eq("country_code", filter.countryCode);
    }

    const from = (filter.page - 1) * filter.pageSize;
    const { count, data, error } = await request
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + filter.pageSize - 1);

    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to list clients.",
        error,
      );
    }

    const total = count ?? 0;
    return {
      items: data.map(mapClientListItem),
      page: filter.page,
      pageSize: filter.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filter.pageSize)),
    };
  }

  async findById(
    clientId: string,
    context: RepositoryContext,
  ): Promise<ClientProfile | null> {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .eq("agency_id", context.tenant.agencyId)
      .eq("id", clientId)
      .maybeSingle();

    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load the client.",
        error,
      );
    }

    return data ? mapClient(data) : null;
  }

  async create(
    input: CreateClientRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc("create_client_profile", {
      requested_agency_id: context.tenant.agencyId,
      requested_name: input.name,
      requested_slug: input.slug,
      requested_legal_name: input.legalName ?? "",
      requested_website_url: input.websiteUrl ?? "",
      requested_industry: input.industry ?? "",
      requested_country_code: input.countryCode ?? "",
      requested_language_code: input.languageCode ?? "",
      requested_timezone: input.timezone ?? "",
      requested_description: input.description ?? "",
      requested_logo_url: input.logoUrl ?? "",
      requested_objectives: [...input.objectives],
      requested_status: input.status,
    });

    if (error || !data) {
      return mutationError(
        error ?? { message: "Client creation returned no identifier." },
      );
    }

    return data;
  }

  async update(
    input: UpdateClientRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const { data, error } = await this.supabase.rpc("update_client_profile", {
      requested_agency_id: context.tenant.agencyId,
      requested_client_id: input.clientId,
      requested_name: input.name,
      requested_slug: input.slug,
      requested_legal_name: input.legalName ?? "",
      requested_website_url: input.websiteUrl ?? "",
      requested_industry: input.industry ?? "",
      requested_country_code: input.countryCode ?? "",
      requested_language_code: input.languageCode ?? "",
      requested_timezone: input.timezone ?? "",
      requested_description: input.description ?? "",
      requested_logo_url: input.logoUrl ?? "",
      requested_objectives: [...input.objectives],
      requested_status: input.status,
    });

    if (error || !data) {
      return mutationError(
        error ?? { message: "Client update returned no identifier." },
      );
    }

    return data;
  }

  async archive(clientId: string, context: RepositoryContext): Promise<string> {
    const { data, error } = await this.supabase.rpc("archive_client", {
      requested_agency_id: context.tenant.agencyId,
      requested_client_id: clientId,
    });

    if (error || !data) {
      return mutationError(
        error ?? { message: "Client archive returned no identifier." },
      );
    }

    return data;
  }

  async listMembers(
    clientId: string,
    context: RepositoryContext,
  ): Promise<readonly ClientMember[]> {
    const { data: memberships, error } = await this.supabase
      .from("client_members")
      .select("id, profile_id, role_id, status")
      .eq("agency_id", context.tenant.agencyId)
      .eq("client_id", clientId)
      .neq("status", "removed")
      .order("created_at");

    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to list client members.",
        error,
      );
    }

    if (memberships.length === 0) {
      return [];
    }

    const profileIds = [
      ...new Set(memberships.map((membership) => membership.profile_id)),
    ];
    const roleIds = [
      ...new Set(memberships.map((membership) => membership.role_id)),
    ];
    const [profilesResult, rolesResult] = await Promise.all([
      this.supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", profileIds),
      this.supabase.from("roles").select("id, name").in("id", roleIds),
    ]);

    if (profilesResult.error || rolesResult.error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve client member details.",
        profilesResult.error ?? rolesResult.error,
      );
    }

    const profiles = new Map(
      profilesResult.data.map((profile) => [profile.id, profile]),
    );
    const roles = new Map(rolesResult.data.map((role) => [role.id, role]));

    return memberships.map((membership) => ({
      id: membership.id,
      profileId: membership.profile_id,
      displayName:
        profiles.get(membership.profile_id)?.display_name || "Utilisateur",
      avatarUrl: profiles.get(membership.profile_id)?.avatar_url ?? null,
      roleId: membership.role_id,
      roleName: roles.get(membership.role_id)?.name || "Rôle indisponible",
      status: membership.status,
    }));
  }

  async listAssignableAgencyMembers(
    clientId: string,
    context: RepositoryContext,
  ): Promise<readonly AgencyMemberOption[]> {
    const { data: recruiterRole, error: recruiterRoleError } =
      await this.supabase
        .from("roles")
        .select("id")
        .eq("agency_id", context.tenant.agencyId)
        .eq("scope", "agency")
        .eq("slug", "recruiter")
        .is("client_id", null)
        .is("archived_at", null)
        .maybeSingle();

    if (recruiterRoleError || !recruiterRole) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve the Recruiter role.",
        recruiterRoleError,
      );
    }

    const [
      { data: agencyMembers, error: agencyMembersError },
      { data: clientMembers, error: clientMembersError },
    ] = await Promise.all([
      this.supabase
        .from("agency_members")
        .select("profile_id")
        .eq("agency_id", context.tenant.agencyId)
        .eq("role_id", recruiterRole.id)
        .eq("status", "active"),
      this.supabase
        .from("client_members")
        .select("profile_id")
        .eq("agency_id", context.tenant.agencyId)
        .eq("client_id", clientId)
        .neq("status", "removed"),
    ]);

    if (agencyMembersError || clientMembersError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to list assignable members.",
        agencyMembersError ?? clientMembersError,
      );
    }

    const assigned = new Set(
      (clientMembers ?? []).map((membership) => membership.profile_id),
    );
    const availableIds = agencyMembers
      .map((membership) => membership.profile_id)
      .filter((profileId) => !assigned.has(profileId));

    if (availableIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profileError } = await this.supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", availableIds)
      .order("display_name");

    if (profileError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to resolve assignable members.",
        profileError,
      );
    }

    return profiles.map((profile) => ({
      profileId: profile.id,
      displayName: profile.display_name || "Utilisateur",
    }));
  }

  async listClientRoles(
    clientId: string,
    context: RepositoryContext,
  ): Promise<readonly ClientRoleOption[]> {
    const { data, error } = await this.supabase
      .from("roles")
      .select("id, name")
      .eq("agency_id", context.tenant.agencyId)
      .eq("client_id", clientId)
      .eq("scope", "client")
      .eq("slug", "recruiter")
      .is("archived_at", null)
      .order("name");

    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to list client roles.",
        error,
      );
    }

    return data;
  }
}
