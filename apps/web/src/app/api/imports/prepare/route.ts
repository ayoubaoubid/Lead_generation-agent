import { NextResponse } from "next/server";

import { createServerLeadDataModule } from "@/lib/lead-data/server-lead-data-module";
import { isSameOriginMutation } from "@/lib/security/same-origin";
import {
  enforceServerRateLimit,
  ServerRateLimitExceededError,
} from "@/lib/security/server-rate-limit";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import { prepareDataImportSchema } from "@/validations/imports/data-import.schema";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { code: "ORIGIN_REJECTED", message: "Requête refusée." },
      { status: 403 },
    );
  }
  try {
    const parsed = prepareDataImportSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_FAILED", message: "Configuration CSV invalide." },
        { status: 400 },
      );
    }
    const { supabase, tenant, user } = await resolveActiveClientTenant([
      "lead.read",
      "lead.write",
    ]);
    await enforceServerRateLimit({
      scope: "imports.prepare",
      subject: `${tenant.agencyId}:${tenant.clientId}:${user.id}`,
      limit: 20,
      windowSeconds: 60,
    });
    const { imports, context } = createServerLeadDataModule(supabase, tenant);
    return NextResponse.json(await imports.prepare(parsed.data, context), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof ServerRateLimitExceededError) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        code: "IMPORT_PREPARATION_FAILED",
        message: "Impossible de préparer cet import.",
      },
      { status: 503 },
    );
  }
}
