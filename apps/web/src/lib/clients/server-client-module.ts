import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverLogger } from "@/lib/logging/server-logger";
import { SupabaseClientRepository } from "@/repositories/supabase/supabase-client.repository";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import { ClientService } from "@/services/clients/client.service";
import type { ServiceContext } from "@/services/service-context";
import type { Database } from "@/types/database.generated";
import type { TenantContext } from "@/types/tenant-context";

export function createServerClientModule(
  supabase: SupabaseClient<Database>,
  tenant: TenantContext,
) {
  const context: ServiceContext = {
    tenant,
    correlationId: crypto.randomUUID(),
    logger: serverLogger,
  };
  const service = new ClientService({
    clients: new SupabaseClientRepository(supabase),
    access: new SupabaseTenantAccessRepository(supabase),
  });

  return { context, service };
}
