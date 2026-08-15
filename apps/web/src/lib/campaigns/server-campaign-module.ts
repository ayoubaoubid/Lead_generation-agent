import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverLogger } from "@/lib/logging/server-logger";
import { SupabaseCampaignRepository } from "@/repositories/supabase/supabase-campaign.repository";
import { SupabaseCampaignMessageRepository } from "@/repositories/supabase/supabase-campaign-message.repository";
import { CampaignService } from "@/services/campaigns/campaign.service";
import { CampaignMessageService } from "@/services/messages/campaign-message.service";
import type { ServiceContext } from "@/services/service-context";
import type { Database } from "@/types/database.generated";
import type { TenantContext } from "@/types/tenant-context";

export function createServerCampaignModule(
  supabase: SupabaseClient<Database>,
  tenant: TenantContext,
) {
  const context: ServiceContext = {
    tenant,
    correlationId: crypto.randomUUID(),
    logger: serverLogger,
  };
  return {
    context,
    campaigns: new CampaignService(new SupabaseCampaignRepository(supabase)),
    messages: new CampaignMessageService(
      new SupabaseCampaignMessageRepository(supabase),
    ),
  };
}
