import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export class ServerRateLimitExceededError extends Error {
  constructor() {
    super("SERVER_RATE_LIMIT_EXCEEDED");
    this.name = "ServerRateLimitExceededError";
  }
}

type ServerRateLimitInput = Readonly<{
  scope: string;
  subject: string;
  limit: number;
  windowSeconds: number;
}>;

export async function enforceServerRateLimit(input: ServerRateLimitInput) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("service_consume_api_rate_limit", {
    requested_limit: input.limit,
    requested_scope: input.scope,
    requested_subject: input.subject,
    requested_window_seconds: input.windowSeconds,
  });

  if (error) {
    throw new Error("SERVER_RATE_LIMIT_CHECK_FAILED");
  }
  if (!data) {
    throw new ServerRateLimitExceededError();
  }
}
