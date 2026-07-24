import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverLogger } from "@/lib/logging/server-logger";
import { SupabaseTargetingRepository } from "@/repositories/supabase/supabase-targeting.repository";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import type { ServiceContext } from "@/services/service-context";
import { TargetingService } from "@/services/targeting/targeting.service";
import type { Database } from "@/types/database.generated";
import type { TenantContext } from "@/types/tenant-context";

export function createServerTargetingModule(
  supabase: SupabaseClient<Database>,
  tenant: TenantContext,
) {
  const context: ServiceContext = {
    tenant,
    correlationId: crypto.randomUUID(),
    logger: serverLogger,
  };
  const service = new TargetingService({
    targeting: new SupabaseTargetingRepository(supabase),
    access: new SupabaseTenantAccessRepository(supabase),
  });
  return { context, service };
}
