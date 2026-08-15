import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Contact } from "@/domain/contacts/contact";
import type { ContactRepository } from "@/repositories/contracts/contact.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";

function clientTenant(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped contact context required.",
    );
  }
  return context.tenant;
}

function mutationFailure(error: { code?: string; message: string }): never {
  throw new RepositoryError(
    error.code && ["23505", "23514", "42501", "55000"].includes(error.code)
      ? "conflict"
      : "unavailable",
    "Contact persistence failed.",
    error,
  );
}

function contactPayload(
  input: Parameters<ContactRepository["create"]>[0],
): Json {
  return {
    companyId: input.companyId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName: input.fullName,
    email: input.email,
    linkedinUrl: input.linkedinUrl,
    jobTitle: input.jobTitle,
    department: input.department,
    seniority: input.seniority,
    phone: input.phone,
    countryCode: input.countryCode,
    factStatus: input.factStatus,
    confidenceScore: input.confidenceScore,
    sourceProvider: input.sourceProvider,
    externalId: input.externalId,
    sourceUrl: input.sourceUrl,
    collectedAt: input.collectedAt,
  };
}

export class SupabaseContactRepository implements ContactRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(search: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    let query = this.supabase
      .from("contacts")
      .select("*")
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(100);
    const normalizedSearch = search
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalizedSearch) {
      query = query.ilike("normalized_name", `%${normalizedSearch}%`);
    }
    const { data, error } = await query;
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load contacts.",
        error,
      );
    }

    const companyIds = [
      ...new Set(
        data
          .map(({ company_id: companyId }) => companyId)
          .filter((companyId): companyId is string => Boolean(companyId)),
      ),
    ];
    const companyNames = new Map<string, string>();
    if (companyIds.length > 0) {
      const companiesResult = await this.supabase
        .from("companies")
        .select("id,name")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .in("id", companyIds);
      if (companiesResult.error) {
        throw new RepositoryError(
          "unavailable",
          "Unable to load contact companies.",
          companiesResult.error,
        );
      }
      companiesResult.data.forEach(({ id, name }) =>
        companyNames.set(id, name),
      );
    }

    return data.map((row): Contact => ({
      id: row.id,
      companyId: row.company_id,
      companyName: row.company_id
        ? (companyNames.get(row.company_id) ?? null)
        : null,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: row.full_name,
      normalizedName: row.normalized_name,
      email: row.email,
      linkedinUrl: row.linkedin_url,
      jobTitle: row.job_title,
      department: row.department,
      seniority: row.seniority,
      phone: row.phone,
      countryCode: row.country_code,
      factStatus: row.fact_status,
      confidenceScore: row.confidence_score,
      verificationStatus: row.verification_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async create(
    input: Parameters<ContactRepository["create"]>[0],
    context: RepositoryContext,
  ) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase.rpc("create_contact", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_payload: contactPayload(input),
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Contact creation returned no id." },
      );
    }
    return data;
  }

  async archive(contactId: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase.rpc("archive_contact", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_contact_id: contactId,
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Contact archive returned no id." },
      );
    }
    return data;
  }
}
