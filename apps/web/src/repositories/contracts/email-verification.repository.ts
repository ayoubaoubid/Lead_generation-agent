import type { RepositoryContext } from "@/repositories/repository-context";
import type {
  ProviderCost,
  SanitizedProviderValue,
  ProviderUsageDelta,
  ProviderWarning,
} from "@/services/providers/provider-context";
import type { NormalizedEmailVerification } from "@/validations/verification/email-verification.schema";

export type ContactEmailForVerification = Readonly<{
  contactId: string;
  agencyId: string;
  clientId: string;
  email: string | null;
}>;

export type StoredEmailVerification = Readonly<{
  verificationId: string;
  contactId: string;
  email: string;
  idempotencyKey: string;
  provider: string;
  providerRequestId: string | null;
  result: NormalizedEmailVerification;
  observedAt: string;
  cost: ProviderCost;
  usage: readonly ProviderUsageDelta[];
  warnings: readonly ProviderWarning[];
  sanitizedRawResult: Readonly<Record<string, SanitizedProviderValue>>;
}>;

export type EmailVerificationReservation =
  | Readonly<{
      state: "reserved";
      verificationId: string;
    }>
  | Readonly<{
      state: "completed";
      verification: StoredEmailVerification;
    }>
  | Readonly<{
      state: "in_progress";
      verificationId: string;
    }>;

export interface EmailVerificationRepository {
  findContactEmail(
    contactId: string,
    context: RepositoryContext,
  ): Promise<ContactEmailForVerification | null>;

  reserveVerification(
    input: Readonly<{
      contactId: string;
      email: string;
      idempotencyKey: string;
    }>,
    context: RepositoryContext,
  ): Promise<EmailVerificationReservation>;

  completeVerification(
    input: StoredEmailVerification,
    context: RepositoryContext,
  ): Promise<void>;

  failVerification(
    input: Readonly<{
      verificationId: string;
      errorCode: string;
      isRetryable: boolean;
    }>,
    context: RepositoryContext,
  ): Promise<void>;
}
