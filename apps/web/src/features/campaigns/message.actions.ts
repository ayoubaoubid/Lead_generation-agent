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
  createCampaignMessageVariantSchema,
  humanMessageReviewSchema,
  submitCampaignMessageSchema,
} from "@/validations/messages/campaign-message.schema";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function editCampaignMessageAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "message.read",
      "message.write",
    ]);
    const { messages, context } = createServerCampaignModule(supabase, tenant);
    const sourceVersionId = field(formData, "sourceVersionId");
    const source = (await messages.list(context)).find(
      (variant) => variant.id === sourceVersionId,
    );
    if (!source) {
      return {
        status: "error",
        message: "La variante source est introuvable dans ce client.",
      };
    }

    const parsed = createCampaignMessageVariantSchema.safeParse({
      messageId: source.messageId,
      campaignId: source.campaignId,
      campaignProspectId: source.campaignProspectId,
      sequenceStepId: source.sequenceStepId,
      origin: "human_edit",
      format: source.format,
      subject: field(formData, "subject") || null,
      body: field(formData, "body"),
      callToAction: field(formData, "callToAction"),
      mainIdea: field(formData, "mainIdea"),
      groundedStatements: source.groundedStatements,
      missingEvidence: source.missingEvidence,
      inputSnapshot: { sourceVersionId: source.id },
      skillVersions: source.skillVersions,
      aiExecutionId: null,
      generationCostMicrousd: null,
      generationTokens: null,
    });
    if (!parsed.success) return tenantValidationErrorState(parsed.error);

    const versionId = await messages.createVariant(parsed.data, context);
    revalidatePath("/campaigns");
    return tenantActionSuccessState(
      "Une nouvelle variante a été enregistrée en brouillon.",
      versionId,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function submitCampaignMessageAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = submitCampaignMessageSchema.safeParse({
    versionId: field(formData, "versionId"),
  });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "message.read",
      "message.write",
    ]);
    const { messages, context } = createServerCampaignModule(supabase, tenant);
    await messages.submitForReview(parsed.data, context);
    revalidatePath("/campaigns");
    return tenantActionSuccessState(
      "La variante est entrée dans le workflow de revue.",
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function reviewCampaignMessageAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = humanMessageReviewSchema.safeParse({
    versionId: field(formData, "versionId"),
    decision: field(formData, "decision"),
    issues: formData
      .getAll("issues")
      .filter((value): value is string => typeof value === "string" && !!value),
  });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "message.read",
      "message.approve",
    ]);
    const { messages, context } = createServerCampaignModule(supabase, tenant);
    await messages.reviewHuman(parsed.data, context);
    revalidatePath("/campaigns");
    return tenantActionSuccessState(
      parsed.data.decision === "approve"
        ? "La variante exacte a été approuvée."
        : "La variante a été rejetée. Créez une nouvelle version pour la corriger.",
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
