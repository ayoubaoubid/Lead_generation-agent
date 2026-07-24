import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverLogger } from "@/lib/logging/server-logger";
import { SupabaseStrategyRepository } from "@/repositories/supabase/supabase-strategy.repository";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import type { ServiceContext } from "@/services/service-context";
import { StrategyService } from "@/services/strategy/strategy.service";
import type { Database } from "@/types/database.generated";
import type { TenantContext } from "@/types/tenant-context";

export function createServerStrategyModule(
  supabase: SupabaseClient<Database>,
  tenant: TenantContext,
) {
  const context: ServiceContext = {
    tenant,
    correlationId: crypto.randomUUID(),
    logger: serverLogger,
  };
  const service = new StrategyService({
    strategy: new SupabaseStrategyRepository(supabase),
    access: new SupabaseTenantAccessRepository(supabase),
  });

  return { context, service };
}
