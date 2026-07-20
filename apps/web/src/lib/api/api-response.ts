import type {
  DomainError,
  DomainErrorCode,
} from "@/domain/errors/domain-error";

type ApiResponseMeta = Readonly<{
  requestId: string;
  correlationId: string;
}>;

export type ApiSuccess<TData> = Readonly<{
  ok: true;
  data: TData;
  meta: ApiResponseMeta;
}>;

export type ApiFailure = Readonly<{
  ok: false;
  error: Readonly<{
    code: DomainErrorCode | "internal_error";
    message: string;
    fieldErrors?: Readonly<Record<string, readonly string[]>>;
  }>;
  meta: ApiResponseMeta;
}>;

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export type ApiFailureResult = Readonly<{
  status: number;
  body: ApiFailure;
}>;

const domainErrorStatus: Readonly<Record<DomainErrorCode, number>> = {
  validation_failed: 400,
  authentication_required: 401,
  permission_denied: 403,
  resource_not_found: 404,
  conflict: 409,
  invalid_state: 409,
  tenant_mismatch: 403,
  rate_limited: 429,
  external_dependency_failed: 502,
};

export function createApiSuccess<TData>(
  data: TData,
  meta: ApiResponseMeta,
): ApiSuccess<TData> {
  return { ok: true, data, meta };
}

export function createApiFailure(
  error: DomainError,
  meta: ApiResponseMeta,
): ApiFailureResult {
  return {
    status: domainErrorStatus[error.code],
    body: {
      ok: false,
      error: {
        code: error.code,
        message: error.publicMessage,
      },
      meta,
    },
  };
}

export function createInternalApiFailure(
  meta: ApiResponseMeta,
): ApiFailureResult {
  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: "internal_error",
        message: "An unexpected error occurred.",
      },
      meta,
    },
  };
}
