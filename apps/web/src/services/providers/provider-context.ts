export type ProviderContext = Readonly<{
  agencyId: string;
  clientId: string;
  resourceId: string;
  correlationId: string;
  idempotencyKey: string;
  actorId?: string;
  credentialRef?: string;
}>;

export type ProviderUsageDelta = Readonly<{
  operation: string;
  quantity: number;
  unit: string;
}>;

export type ProviderCost = Readonly<{
  amount: number;
  currency: string;
}>;

export type SanitizedProviderValue =
  | boolean
  | number
  | string
  | null
  | readonly SanitizedProviderValue[]
  | Readonly<{ [key: string]: SanitizedProviderValue }>;

export type ProviderWarning = Readonly<{
  code: string;
  message: string;
}>;

export type ProviderResult<T> = Readonly<{
  data: T;
  provider: string;
  providerRequestId?: string;
  observedAt: string;
  usage: readonly ProviderUsageDelta[];
  cost: ProviderCost;
  warnings: readonly ProviderWarning[];
  sanitizedRawResult: Readonly<Record<string, SanitizedProviderValue>>;
}>;

export const providerErrorCodes = [
  "authentication_failed",
  "authorization_failed",
  "invalid_request",
  "not_found",
  "conflict",
  "rate_limited",
  "quota_exceeded",
  "timeout",
  "temporarily_unavailable",
  "provider_rejected",
  "invalid_response",
  "cancelled",
  "unknown_provider_error",
] as const;

export type ProviderErrorCode = (typeof providerErrorCodes)[number];

export class ProviderError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    message: string,
    readonly retryable: boolean,
    readonly retryAfterMs?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
