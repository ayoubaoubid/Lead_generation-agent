import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_WEBHOOK_AGE_SECONDS = 300;

export type WebhookSignatureInput = Readonly<{
  body: string;
  signature: string;
  timestamp: string;
  secret: string;
  nowSeconds?: number;
}>;

export function verifyWebhookSignature({
  body,
  signature,
  timestamp,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
}: WebhookSignatureInput): boolean {
  const parsedTimestamp = Number(timestamp);
  if (
    !Number.isInteger(parsedTimestamp) ||
    Math.abs(nowSeconds - parsedTimestamp) > MAX_WEBHOOK_AGE_SECONDS
  ) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");
  const received = signature.replace(/^sha256=/, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;

  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex"),
  );
}
