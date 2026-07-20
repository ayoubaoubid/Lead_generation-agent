import { describe, expect, it } from "vitest";

import { DomainError } from "@/domain/errors/domain-error";

import {
  createApiFailure,
  createApiSuccess,
  createInternalApiFailure,
} from "./api-response";

const meta = {
  requestId: "request-1",
  correlationId: "correlation-1",
};

describe("API response helpers", () => {
  it("creates a stable success envelope", () => {
    expect(createApiSuccess({ id: "resource-1" }, meta)).toEqual({
      ok: true,
      data: { id: "resource-1" },
      meta,
    });
  });

  it("maps a domain conflict to an HTTP-safe response", () => {
    const result = createApiFailure(
      new DomainError("conflict", "The resource already exists."),
      meta,
    );

    expect(result).toEqual({
      status: 409,
      body: {
        ok: false,
        error: {
          code: "conflict",
          message: "The resource already exists.",
        },
        meta,
      },
    });
  });

  it("does not expose an internal exception in a generic failure", () => {
    expect(createInternalApiFailure(meta)).toEqual({
      status: 500,
      body: {
        ok: false,
        error: {
          code: "internal_error",
          message: "An unexpected error occurred.",
        },
        meta,
      },
    });
  });
});
