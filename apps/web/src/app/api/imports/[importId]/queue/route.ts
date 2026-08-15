import { idempotencyKeys, tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerLeadDataModule } from "@/lib/lead-data/server-lead-data-module";
import { isSameOriginMutation } from "@/lib/security/same-origin";
import {
  enforceServerRateLimit,
  ServerRateLimitExceededError,
} from "@/lib/security/server-rate-limit";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";

export async function POST(
  request: Request,
  context: { params: Promise<{ importId: string }> },
) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { code: "ORIGIN_REJECTED", message: "Requête refusée." },
      { status: 403 },
    );
  }
  try {
    const importId = z.uuid().parse((await context.params).importId);
    const { supabase, tenant, user } = await resolveActiveClientTenant([
      "lead.read",
      "lead.write",
    ]);
    await enforceServerRateLimit({
      scope: "imports.queue",
      subject: `${tenant.agencyId}:${tenant.clientId}:${user.id}`,
      limit: 10,
      windowSeconds: 60,
    });
    const leadDataModule = createServerLeadDataModule(supabase, tenant);
    await leadDataModule.imports.markReady(importId, leadDataModule.context);
    const businessIdempotencyKey = `csv-import:${importId}`;
    const idempotencyKey = await idempotencyKeys.create(
      businessIdempotencyKey,
      { scope: "global" },
    );
    const run = await tasks.trigger(
      "import.processCsv",
      {
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
        actorId: user.id,
        resourceId: importId,
        idempotencyKey: businessIdempotencyKey,
      },
      { idempotencyKey, idempotencyKeyTTL: "30d" },
    );
    await leadDataModule.imports.setTriggerRun(
      importId,
      run.id,
      leadDataModule.context,
    );
    return NextResponse.json({ importId, runId: run.id }, { status: 202 });
  } catch (error) {
    if (error instanceof ServerRateLimitExceededError) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Trop de requêtes. Réessayez." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        code: "IMPORT_QUEUE_FAILED",
        message:
          "Le fichier est conservé, mais le traitement n’a pas pu être planifié. Réessayez.",
      },
      { status: 503 },
    );
  }
}
