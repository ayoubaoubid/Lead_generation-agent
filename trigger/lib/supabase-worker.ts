import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../apps/web/src/types/database.generated";

export class TriggerWorkerConfigurationError extends Error {
  constructor() {
    super("TRIGGER_WORKER_CONFIGURATION_MISSING");
    this.name = "TriggerWorkerConfigurationError";
  }
}

export function createTriggerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new TriggerWorkerConfigurationError();
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export type TriggerSupabaseClient = ReturnType<
  typeof createTriggerSupabaseClient
>;
