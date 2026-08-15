import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyWebhookSignature } from "./webhook-signature";

describe("verifyWebhookSignature", () => {
  const body = '{"eventId":"evt_1"}';
  const secret = "test-secret";
  const timestamp = "1000";
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  it("accepts a current valid signature", () => {
    expect(
      verifyWebhookSignature({
        body,
        secret,
        signature,
        timestamp,
        nowSeconds: 1001,
      }),
    ).toBe(true);
  });

  it("rejects a forged signature", () => {
    expect(
      verifyWebhookSignature({
        body,
        secret,
        signature: "a".repeat(64),
        timestamp,
        nowSeconds: 1001,
      }),
    ).toBe(false);
  });

  it("rejects replay outside the five minute window", () => {
    expect(
      verifyWebhookSignature({
        body,
        secret,
        signature,
        timestamp,
        nowSeconds: 1400,
      }),
    ).toBe(false);
  });
});
