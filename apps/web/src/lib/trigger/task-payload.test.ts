import { describe, expect, it } from "vitest";

import { durableTaskPayloadSchema } from "../../../../../trigger/lib/task-payload";

const validPayload = {
  agencyId: "11111111-1111-4111-8111-111111111111",
  clientId: "22222222-2222-4222-8222-222222222222",
  actorId: "33333333-3333-4333-8333-333333333333",
  resourceId: "44444444-4444-4444-8444-444444444444",
  idempotencyKey: "campaign:resource:version-1",
};

describe("durableTaskPayloadSchema", () => {
  it("accepts the shared tenant-aware contract", () => {
    expect(durableTaskPayloadSchema.parse(validPayload)).toEqual(validPayload);
  });

  it("rejects malformed tenant identifiers", () => {
    expect(
      durableTaskPayloadSchema.safeParse({
        ...validPayload,
        clientId: "client-from-browser",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown payload fields and unsafe idempotency keys", () => {
    expect(
      durableTaskPayloadSchema.safeParse({
        ...validPayload,
        idempotencyKey: "contains spaces and PII@example.test",
        providerSecret: "must-not-enter-payloads",
      }).success,
    ).toBe(false);
  });
});
