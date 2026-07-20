import { describe, expect, it } from "vitest";

import { tenantContextSchema } from "./tenant-context.schema";

const agencyId = "018f47c2-9e18-7f5b-a268-770f5aee7d21";
const clientId = "018f47c2-f7de-7b75-b93d-c6c3ee1b6a28";
const actorId = "018f47c3-274e-72ea-9f9b-ff18d37222cc";

describe("tenantContextSchema", () => {
  it("accepts an agency-scoped user context", () => {
    const result = tenantContextSchema.safeParse({
      scope: "agency",
      agencyId,
      actor: { kind: "user", actorId },
    });

    expect(result.success).toBe(true);
  });

  it("requires a client identifier for client-scoped access", () => {
    const result = tenantContextSchema.safeParse({
      scope: "client",
      agencyId,
      actor: { kind: "user", actorId },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a complete client-scoped service context", () => {
    const result = tenantContextSchema.safeParse({
      scope: "client",
      agencyId,
      clientId,
      actor: { kind: "service", serviceName: "trigger-worker" },
    });

    expect(result.success).toBe(true);
  });
});
