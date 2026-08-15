import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/config/public-env";
import { serverEnv } from "@/config/server-env";
import type { Database } from "@/types/database.generated";

export class SupabaseAdminConfigurationError extends Error {
  constructor() {
    super("Supabase server administration is not configured.");
    this.name = "SupabaseAdminConfigurationError";
  }
}

export function createAdminSupabaseClient() {
  const config = getSupabasePublicConfig();
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!config || !serviceRoleKey) {
    throw new SupabaseAdminConfigurationError();
  }

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
