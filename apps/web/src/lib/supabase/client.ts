"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/config/public-env";
import type { Database } from "@/types/database.generated";

export function createBrowserSupabaseClient() {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("SUPABASE_PUBLIC_CONFIGURATION_MISSING");
  }
  return createBrowserClient<Database>(config.url, config.publishableKey);
}
