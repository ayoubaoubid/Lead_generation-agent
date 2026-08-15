import { createHash } from "node:crypto";

import { idempotencyKeys, tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "@/config/server-env";
import {
  enforceServerRateLimit,
  ServerRateLimitExceededError,
} from "@/lib/security/server-rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/security/webhook-signature";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;

const inboundEventSchema = z
  .object({
    eventId: z.string().trim().min(4).max(240),
    providerMessageId: z.string().trim().min(4).max(240),
    providerThreadId: z.string().trim().min(1).max(240).optional(),
    from: z.email().transform((value) => value.toLowerCase()),
    to: z.email().transform((value) => value.toLowerCase()),
    subject: z.string().max(1000).optional(),
    text: z.string().min(1).max(100_000),
    occurredAt: z.iso.datetime(),
  })
  .strict();

export async function POST(request: Request) {
  const secret = serverEnv.INBOUND_WEBHOOK_SECRET;
  const timestamp = request.headers.get("x-webhook-timestamp");
  const signature = request.headers.get("x-webhook-signature");
  if (!secret || !timestamp || !signature) {
    return NextResponse.json({ code: "WEBHOOK_UNAUTHORIZED" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_WEBHOOK_BODY_BYTES
  ) {
    return NextResponse.json({ code: "WEBHOOK_TOO_LARGE" }, { status: 413 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ code: "WEBHOOK_TOO_LARGE" }, { status: 413 });
  }
  if (
    !verifyWebhookSignature({
      body: rawBody,
      secret,
      signature,
      timestamp,
    })
  ) {
    return NextResponse.json({ code: "WEBHOOK_UNAUTHORIZED" }, { status: 401 });
  }

  const provider = serverEnv.INBOUND_WEBHOOK_PROVIDER;
  const sourceAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unresolved";
  try {
    await enforceServerRateLimit({
      scope: "webhook.inbound",
      subject: `${provider}:${sourceAddress}`,
      limit: 120,
      windowSeconds: 60,
    });
  } catch (error) {
    if (error instanceof ServerRateLimitExceededError) {
      return NextResponse.json(
        { code: "WEBHOOK_RATE_LIMITED" },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { code: "WEBHOOK_RATE_LIMIT_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const parsed = inboundEventSchema.safeParse(
    (() => {
      try {
        return JSON.parse(rawBody) as unknown;
      } catch {
        return null;
      }
    })(),
  );
  if (!parsed.success) {
    return NextResponse.json({ code: "WEBHOOK_INVALID" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const existing = await admin
    .from("inbound_webhook_events")
    .select("id,status")
    .eq("provider", provider)
    .eq("provider_event_id", parsed.data.eventId)
    .maybeSingle();
  if (existing.error) {
    return NextResponse.json({ code: "WEBHOOK_STORE_FAILED" }, { status: 503 });
  }
  if (existing.data) {
    return NextResponse.json(
      { accepted: true, duplicate: true },
      { status: 202 },
    );
  }

  const outbound = await admin
    .from("outbound_messages")
    .select("id,agency_id,client_id,campaign_id,campaign_prospect_id")
    .eq("provider_message_id", parsed.data.providerMessageId)
    .maybeSingle();
  if (outbound.error) {
    return NextResponse.json(
      { code: "WEBHOOK_LOOKUP_FAILED" },
      { status: 503 },
    );
  }

  const event = await admin
    .from("inbound_webhook_events")
    .insert({
      provider,
      provider_event_id: parsed.data.eventId,
      signature_version: "hmac-sha256-v1",
      payload_sha256: payloadHash,
      occurred_at: parsed.data.occurredAt,
      status: "verified",
      agency_id: outbound.data?.agency_id ?? null,
      client_id: outbound.data?.client_id ?? null,
      error_code: outbound.data ? null : "TENANT_UNRESOLVED",
    })
    .select("id")
    .single();
  if (event.error) {
    if (event.error.code === "23505") {
      return NextResponse.json(
        { accepted: true, duplicate: true },
        { status: 202 },
      );
    }
    return NextResponse.json({ code: "WEBHOOK_STORE_FAILED" }, { status: 503 });
  }

  if (!outbound.data) {
    return NextResponse.json(
      { accepted: true, requiresReview: true },
      { status: 202 },
    );
  }

  const prospect = await admin
    .from("campaign_prospects")
    .select("contact_id")
    .eq("id", outbound.data.campaign_prospect_id)
    .eq("agency_id", outbound.data.agency_id)
    .eq("client_id", outbound.data.client_id)
    .single();
  if (prospect.error) {
    return NextResponse.json(
      { code: "WEBHOOK_LOOKUP_FAILED" },
      { status: 503 },
    );
  }

  const inbound = await admin
    .from("inbound_messages")
    .insert({
      agency_id: outbound.data.agency_id,
      client_id: outbound.data.client_id,
      webhook_event_id: event.data.id,
      outbound_message_id: outbound.data.id,
      campaign_id: outbound.data.campaign_id,
      campaign_prospect_id: outbound.data.campaign_prospect_id,
      contact_id: prospect.data.contact_id,
      provider_message_id: parsed.data.providerMessageId,
      provider_thread_id: parsed.data.providerThreadId ?? null,
      sender_address: parsed.data.from,
      recipient_address: parsed.data.to,
      subject: parsed.data.subject ?? null,
      body_text: parsed.data.text,
      received_at: parsed.data.occurredAt,
    })
    .select("id")
    .single();
  if (inbound.error) {
    return NextResponse.json({ code: "WEBHOOK_STORE_FAILED" }, { status: 503 });
  }

  const stopped = await admin.rpc("stop_campaign_prospect_sequence", {
    requested_agency_id: outbound.data.agency_id,
    requested_client_id: outbound.data.client_id,
    requested_campaign_prospect_id: outbound.data.campaign_prospect_id,
    requested_reason: "reply_received",
    requested_source_resource_type: "inbound_message",
    requested_source_resource_id: inbound.data.id,
  });
  if (stopped.error) {
    return NextResponse.json({ code: "SEQUENCE_STOP_FAILED" }, { status: 503 });
  }

  const businessKey = `inbound:${provider}:${parsed.data.eventId}`;
  try {
    const triggerKey = await idempotencyKeys.create(businessKey, {
      scope: "global",
    });
    await tasks.trigger(
      "reply.processInbound",
      {
        agencyId: outbound.data.agency_id,
        clientId: outbound.data.client_id,
        resourceId: event.data.id,
        idempotencyKey: businessKey,
      },
      { idempotencyKey: triggerKey, idempotencyKeyTTL: "30d" },
    );
  } catch {
    await admin
      .from("inbound_webhook_events")
      .update({ status: "failed", error_code: "TRIGGER_QUEUE_FAILED" })
      .eq("id", event.data.id);
    return NextResponse.json(
      {
        accepted: true,
        inboundMessageId: inbound.data.id,
        processingQueued: false,
      },
      { status: 202 },
    );
  }

  return NextResponse.json(
    {
      accepted: true,
      inboundMessageId: inbound.data.id,
      processingQueued: true,
    },
    { status: 202 },
  );
}
