import type { ProviderOperationKind } from "@/domain/enrichment/provider-operation";
import type { RepositoryContext } from "@/repositories/repository-context";
import type {
  ProviderCost,
  ProviderUsageDelta,
  ProviderWarning,
  SanitizedProviderValue,
} from "@/services/providers/provider-context";

export type CompanyForEnrichment = Readonly<{
  companyId: string;
  agencyId: string;
  clientId: string;
  name: string;
  domain: string | null;
  websiteUrl: string | null;
}>;

export type ContactForEnrichment = Readonly<{
  contactId: string;
  agencyId: string;
  clientId: string;
  companyId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  linkedinUrl: string | null;
}>;

export type StoredProviderOperation = Readonly<{
  operationId: string;
  operationKind: ProviderOperationKind;
  provider: string;
  normalizedResult: unknown;
  sanitizedRawResult: Readonly<Record<string, SanitizedProviderValue>>;
  confidenceScore: number | null;
  source: string | null;
  sourceUrl: string | null;
  cost: ProviderCost;
  usage: readonly ProviderUsageDelta[];
  warnings: readonly ProviderWarning[];
  observedAt: string;
}>;

export type ProviderOperationReservation =
  | Readonly<{ state: "reserved"; operationId: string }>
  | Readonly<{ state: "in_progress"; operationId: string }>
  | Readonly<{
      state: "completed";
      operation: StoredProviderOperation;
    }>;

export interface ProviderOperationRepository {
  findCompany(
    companyId: string,
    context: RepositoryContext,
  ): Promise<CompanyForEnrichment | null>;

  findContact(
    contactId: string,
    context: RepositoryContext,
  ): Promise<ContactForEnrichment | null>;

  reserve(
    input: Readonly<{
      operationKind: ProviderOperationKind;
      provider: string;
      companyId: string | null;
      contactId: string | null;
      requestedDomain: string | null;
      idempotencyKey: string;
      inputFingerprint: string;
    }>,
    context: RepositoryContext,
  ): Promise<ProviderOperationReservation>;

  complete(
    input: StoredProviderOperation,
    context: RepositoryContext,
  ): Promise<void>;

  fail(
    input: Readonly<{
      operationId: string;
      errorCode: string;
      errorMessageRedacted: string;
      isRetryable: boolean;
    }>,
    context: RepositoryContext,
  ): Promise<void>;
}
