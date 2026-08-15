import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Company } from "@/domain/companies/company";
import type { CompanyRepository } from "@/repositories/contracts/company.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";

function clientTenant(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped company context required.",
    );
  }
  return context.tenant;
}

function mutationFailure(error: { code?: string; message: string }): never {
  throw new RepositoryError(
    error.code && ["23505", "23514", "42501", "55000"].includes(error.code)
      ? "conflict"
      : "unavailable",
    "Company persistence failed.",
    error,
  );
}

function companyPayload(
  input: Parameters<CompanyRepository["create"]>[0],
): Json {
  return {
    name: input.name,
    domain: input.domain,
    websiteUrl: input.websiteUrl,
    industry: input.industry,
    countryCode: input.countryCode,
    employeeCount: input.employeeCount,
    annualRevenue: input.annualRevenue,
    revenueCurrency: input.revenueCurrency,
    technologies: [...input.technologies],
    description: input.description,
    factStatus: input.factStatus,
    confidenceScore: input.confidenceScore,
    sourceProvider: input.sourceProvider,
    externalId: input.externalId,
    sourceUrl: input.sourceUrl,
    collectedAt: input.collectedAt,
  };
}

export class SupabaseCompanyRepository implements CompanyRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(search: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    let query = this.supabase
      .from("companies")
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
        "Unable to load companies.",
        error,
      );
    }
    return data.map((row): Company => ({
      id: row.id,
      name: row.name,
      normalizedName: row.normalized_name,
      domain: row.domain,
      websiteUrl: row.website_url,
      industry: row.industry,
      countryCode: row.country_code,
      employeeCount: row.employee_count,
      annualRevenue: row.annual_revenue,
      revenueCurrency: row.revenue_currency,
      technologies: row.technologies,
      description: row.description,
      factStatus: row.fact_status,
      confidenceScore: row.confidence_score,
      verificationStatus: row.verification_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async create(
    input: Parameters<CompanyRepository["create"]>[0],
    context: RepositoryContext,
  ) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase.rpc("create_company", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_payload: companyPayload(input),
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Company creation returned no id." },
      );
    }
    return data;
  }

  async archive(companyId: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase.rpc("archive_company", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_company_id: companyId,
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Company archive returned no id." },
      );
    }
    return data;
  }
}
