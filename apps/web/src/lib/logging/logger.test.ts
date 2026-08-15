import { describe, expect, it } from "vitest";

import { sanitizeLogContext } from "./logger";

describe("sanitizeLogContext", () => {
  it("redacts sensitive attributes while preserving correlation metadata", () => {
    const context = sanitizeLogContext({
      correlationId: "corr-1",
      operation: "webhook.accept",
      agencyId: "agency-1",
      attributes: {
        provider: "generic",
        emailAddress: "private@example.test",
        payloadHash: "sensitive",
      },
    });

    expect(context.correlationId).toBe("corr-1");
    expect(context.attributes?.provider).toBe("generic");
    expect(context.attributes?.emailAddress).toBe("[REDACTED]");
    expect(context.attributes?.payloadHash).toBe("[REDACTED]");
  });
});
