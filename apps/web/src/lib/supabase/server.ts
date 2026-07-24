import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/config/public-env";
import type { Database } from "@/types/database.generated";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase public configuration is missing.");
    this.name = "SupabaseConfigurationError";
  }
}

export async function createServerSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new SupabaseConfigurationError();
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The Proxy refreshes them.
        }
      },
    },
  });
}
