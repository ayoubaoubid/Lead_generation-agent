export const providerOperationKinds = [
  "company_enrichment",
  "contact_enrichment",
  "email_verification",
  "domain_validation",
] as const;

export type ProviderOperationKind = (typeof providerOperationKinds)[number];

export const providerOperationStatuses = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type ProviderOperationStatus =
  (typeof providerOperationStatuses)[number];

export const emailVerificationResults = [
  "valid",
  "risky",
  "catch_all",
  "unknown",
  "invalid",
  "disposable",
  "role_based",
  "bounced",
  "suppressed",
  "unsubscribed",
] as const;

export type EmailVerificationResult = (typeof emailVerificationResults)[number];
