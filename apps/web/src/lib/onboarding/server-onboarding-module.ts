import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverLogger } from "@/lib/logging/server-logger";
import { SupabaseOnboardingRepository } from "@/repositories/supabase/supabase-onboarding.repository";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import { OnboardingService } from "@/services/onboarding/onboarding.service";
import type { ServiceContext } from "@/services/service-context";
import type { Database } from "@/types/database.generated";
import type { TenantContext } from "@/types/tenant-context";

export function createServerOnboardingModule(
  supabase: SupabaseClient<Database>,
  tenant: TenantContext,
) {
  const context: ServiceContext = {
    tenant,
    correlationId: crypto.randomUUID(),
    logger: serverLogger,
  };
  const service = new OnboardingService({
    onboarding: new SupabaseOnboardingRepository(supabase),
    access: new SupabaseTenantAccessRepository(supabase),
  });

  return { context, service };
}
