import { NextResponse } from "next/server";

import { serverEnv } from "@/config/server-env";
import {
  createAdminSupabaseClient,
  SupabaseAdminConfigurationError,
} from "@/lib/supabase/admin";

export async function GET() {
  let database: "ok" | "degraded" = "degraded";
  try {
    const admin = createAdminSupabaseClient();
    const response = await admin.from("permissions").select("key").limit(1);
    if (!response.error) database = "ok";
  } catch (error) {
    if (!(error instanceof SupabaseAdminConfigurationError)) throw error;
  }

  const status = database === "ok" ? "ok" : "degraded";
  return NextResponse.json(
    {
      status,
      checks: {
        database,
        trigger: serverEnv.TRIGGER_SECRET_KEY ? "configured" : "not_configured",
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
