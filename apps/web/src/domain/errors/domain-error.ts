export const domainErrorCodes = [
  "validation_failed",
  "authentication_required",
  "permission_denied",
  "resource_not_found",
  "conflict",
  "invalid_state",
  "tenant_mismatch",
  "rate_limited",
  "external_dependency_failed",
] as const;

export type DomainErrorCode = (typeof domainErrorCodes)[number];

type DomainErrorOptions = Readonly<{
  details?: Readonly<Record<string, unknown>>;
  cause?: unknown;
}>;

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly publicMessage: string;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(
    code: DomainErrorCode,
    publicMessage: string,
    options: DomainErrorOptions = {},
  ) {
    super(publicMessage, { cause: options.cause });
    this.name = "DomainError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.details = options.details;
  }
}
