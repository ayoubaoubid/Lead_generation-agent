import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ProviderOperationRepository,
  StoredProviderOperation,
} from "@/repositories/contracts/provider-operation.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { SanitizedProviderValue } from "@/services/providers/provider-context";
import type { Database, Json } from "@/types/database.generated";

function clientTenant(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped provider operation context required.",
    );
  }
  return context.tenant;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function sanitizedObject(
  value: Json | null,
): Readonly<Record<string, SanitizedProviderValue>> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return JSON.parse(JSON.stringify(value)) as Readonly<
    Record<string, SanitizedProviderValue>
  >;
}

function storedOperation(
  row: Database["public"]["Tables"]["provider_operations"]["Row"],
): StoredProviderOperation {
  return {
    operationId: row.id,
    operationKind: row.operation_kind,
    provider: row.provider,
    normalizedResult: row.normalized_result,
    sanitizedRawResult: sanitizedObject(row.sanitized_raw_result),
    confidenceScore: row.confidence_score,
    source: row.source,
    sourceUrl: row.source_url,
    cost: {
      amount: row.cost_amount,
      currency: row.cost_currency,
    },
    usage: [],
    warnings: [],
    observedAt: row.completed_at ?? row.updated_at,
  };
}

export class SupabaseProviderOperationRepository implements ProviderOperationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findCompany(companyId: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("companies")
      .select("id,agency_id,client_id,name,domain,website_url")
      .eq("id", companyId)
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .is("archived_at", null)
      .maybeSingle();
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load the company for enrichment.",
        error,
      );
    }
    return data
      ? {
          companyId: data.id,
          agencyId: data.agency_id,
          clientId: data.client_id,
          name: data.name,
          domain: data.domain,
          websiteUrl: data.website_url,
        }
      : null;
  }

  async findContact(contactId: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("contacts")
      .select(
        "id,agency_id,client_id,company_id,first_name,last_name,full_name,email,linkedin_url",
      )
      .eq("id", contactId)
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .is("archived_at", null)
      .maybeSingle();
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load the contact for enrichment.",
        error,
      );
    }
    return data
      ? {
          contactId: data.id,
          agencyId: data.agency_id,
          clientId: data.client_id,
          companyId: data.company_id,
          firstName: data.first_name,
          lastName: data.last_name,
          fullName: data.full_name,
          email: data.email,
          linkedinUrl: data.linkedin_url,
        }
      : null;
  }

  async reserve(
    input: Parameters<ProviderOperationRepository["reserve"]>[0],
    context: RepositoryContext,
  ) {
    const tenant = clientTenant(context);
    const existing = await this.findReservation(
      input.operationKind,
      input.idempotencyKey,
      context,
    );
    if (existing) {
      if (existing.input_fingerprint !== input.inputFingerprint) {
        throw new RepositoryError(
          "conflict",
          "The idempotency key was already used with different inputs.",
        );
      }
      return existing.status === "completed"
        ? {
            state: "completed" as const,
            operation: storedOperation(existing),
          }
        : { state: "in_progress" as const, operationId: existing.id };
    }

    const actorId = tenant.actor.kind === "user" ? tenant.actor.actorId : null;
    const { data, error } = await this.supabase
      .from("provider_operations")
      .insert({
        agency_id: tenant.agencyId,
        client_id: tenant.clientId,
        operation_kind: input.operationKind,
        status: "running",
        provider: input.provider,
        company_id: input.companyId,
        contact_id: input.contactId,
        requested_domain: input.requestedDomain,
        idempotency_key: input.idempotencyKey,
        input_fingerprint: input.inputFingerprint,
        started_at: new Date().toISOString(),
        created_by: actorId,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (error?.code === "23505") {
        const raced = await this.findReservation(
          input.operationKind,
          input.idempotencyKey,
          context,
        );
        if (raced && raced.input_fingerprint === input.inputFingerprint) {
          return raced.status === "completed"
            ? {
                state: "completed" as const,
                operation: storedOperation(raced),
              }
            : { state: "in_progress" as const, operationId: raced.id };
        }
      }
      throw new RepositoryError(
        error?.code === "23505" ? "conflict" : "unavailable",
        "Unable to reserve the provider operation.",
        error,
      );
    }
    return { state: "reserved" as const, operationId: data.id };
  }

  async complete(
    input: StoredProviderOperation,
    context: RepositoryContext,
  ): Promise<void> {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("provider_operations")
      .update({
        status: "completed",
        provider: input.provider,
        source: input.source,
        source_url: input.sourceUrl,
        confidence_score: input.confidenceScore,
        cost_amount: input.cost.amount,
        cost_currency: input.cost.currency,
        sanitized_raw_result: toJson(input.sanitizedRawResult),
        normalized_result: toJson(input.normalizedResult),
        error_code: null,
        error_message_redacted: null,
        is_retryable: false,
        completed_at: input.observedAt,
      })
      .eq("id", input.operationId)
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .eq("status", "running")
      .select("id")
      .maybeSingle();
    if (error || !data) {
      throw new RepositoryError(
        "conflict",
        "Unable to complete the provider operation.",
        error,
      );
    }
  }

  async fail(
    input: Parameters<ProviderOperationRepository["fail"]>[0],
    context: RepositoryContext,
  ): Promise<void> {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("provider_operations")
      .update({
        status: "failed",
        error_code: input.errorCode,
        error_message_redacted: input.errorMessageRedacted,
        is_retryable: input.isRetryable,
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.operationId)
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .eq("status", "running")
      .select("id")
      .maybeSingle();
    if (error || !data) {
      throw new RepositoryError(
        "conflict",
        "Unable to fail the provider operation.",
        error,
      );
    }
  }

  private async findReservation(
    operationKind: Parameters<
      ProviderOperationRepository["reserve"]
    >[0]["operationKind"],
    idempotencyKey: string,
    context: RepositoryContext,
  ) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("provider_operations")
      .select("*")
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .eq("operation_kind", operationKind)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load the provider operation reservation.",
        error,
      );
    }
    return data;
  }
}
