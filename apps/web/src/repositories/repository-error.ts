export const repositoryErrorCodes = [
  "not_found",
  "conflict",
  "unavailable",
  "unexpected_response",
] as const;

export type RepositoryErrorCode = (typeof repositoryErrorCodes)[number];

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "RepositoryError";
    this.code = code;
  }
}
