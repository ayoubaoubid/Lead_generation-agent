import "server-only";

import { DomainError } from "@/domain/errors/domain-error";
import { getRequestedPermissionSnapshot } from "@/lib/authorization/server-permissions";
import { createServerCampaignModule } from "@/lib/campaigns/server-campaign-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";

export async function getCampaignPageData() {
  try {
    const { supabase, tenant } =
      await resolveActiveClientTenant("campaign.read");
    const { campaigns, messages, context } = createServerCampaignModule(
      supabase,
      tenant,
    );
    const [items, variants, permissionSnapshot] = await Promise.all([
      campaigns.list(context),
      messages.list(context),
      getRequestedPermissionSnapshot({
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
      }),
    ]);
    return {
      ok: true as const,
      data: {
        campaigns: items,
        messageVariants: variants,
        permissions: permissionSnapshot.permissions,
        timezone: "UTC",
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof DomainError
          ? error.publicMessage
          : "Les campagnes sont temporairement indisponibles.",
    };
  }
}
