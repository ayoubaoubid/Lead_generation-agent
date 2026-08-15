import { describe, expect, it } from "vitest";

import { DevelopmentEmailVerificationProvider } from "@/services/verification/development-email-verification.provider";

const context = {
  agencyId: "a0000000-0000-4000-8000-000000000001",
  clientId: "c0000000-0000-4000-8000-000000000001",
  resourceId: "20000000-0000-4000-8000-000000000001",
  correlationId: "provider-test",
  idempotencyKey: "verify:provider:test",
};

describe("DevelopmentEmailVerificationProvider", () => {
  it("does not claim an ordinary mailbox is valid without a real provider", async () => {
    const provider = new DevelopmentEmailVerificationProvider();

    const result = await provider.verifyEmail(context, {
      contactId: context.resourceId,
      email: "ada@acme.example",
    });

    expect(result.data.status).toBe("unknown");
    expect(result.cost.amount).toBe(0);
    expect(result.warnings[0]?.code).toBe("development_only");
  });

  it("detects only deterministic development heuristics", async () => {
    const provider = new DevelopmentEmailVerificationProvider();

    await expect(
      provider.verifyEmail(context, {
        contactId: context.resourceId,
        email: "info@acme.example",
      }),
    ).resolves.toMatchObject({ data: { status: "role_based" } });
    await expect(
      provider.verifyEmail(context, {
        contactId: context.resourceId,
        email: "ada@mailinator.com",
      }),
    ).resolves.toMatchObject({ data: { status: "disposable" } });
  });
});
