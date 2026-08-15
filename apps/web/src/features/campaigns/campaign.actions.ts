"use server";

import { revalidatePath } from "next/cache";

import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { createServerCampaignModule } from "@/lib/campaigns/server-campaign-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  campaignTransitionSchema,
  createCampaignDraftSchema,
} from "@/validations/campaigns/campaign.schema";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createCampaignDraftAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = createCampaignDraftSchema.safeParse({
    name: field(formData, "name"),
    objective: field(formData, "objective"),
    channel: field(formData, "channel") || "email",
    timezone: field(formData, "timezone") || "UTC",
    offerId: field(formData, "offerId"),
    icpId: field(formData, "icpId"),
    segmentId: field(formData, "segmentId"),
    personaIds: formData
      .getAll("personaIds")
      .filter((value): value is string => typeof value === "string" && !!value),
    sequenceName: field(formData, "sequenceName"),
    templateSubject: field(formData, "templateSubject"),
    templateBody: field(formData, "templateBody"),
  });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "campaign.read",
      "campaign.create",
    ]);
    const { campaigns, context } = createServerCampaignModule(supabase, tenant);
    const campaignId = await campaigns.createDraft(parsed.data, context);
    revalidatePath("/campaigns");
    return tenantActionSuccessState(
      "La campagne a été créée en brouillon.",
      campaignId,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function transitionCampaignAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = campaignTransitionSchema.safeParse({
    campaignId: field(formData, "campaignId"),
    action: field(formData, "action"),
    scheduledStartAt: field(formData, "scheduledStartAt"),
  });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);
  const permission =
    parsed.data.action === "submit"
      ? "campaign.write"
      : parsed.data.action === "approve"
        ? "campaign.approve"
        : "campaign.launch";
  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "campaign.read",
      permission,
    ]);
    const { campaigns, context } = createServerCampaignModule(supabase, tenant);
    await campaigns.transition(parsed.data, context);
    revalidatePath("/campaigns");
    return tenantActionSuccessState(
      "Le statut de la campagne a été mis à jour.",
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
