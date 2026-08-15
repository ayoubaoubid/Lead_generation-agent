import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { CampaignMessageRepository } from "@/repositories/contracts/campaign-message.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";
import { messageGroundedStatementSchema } from "@/validations/messages/campaign-message.schema";

const stringListSchema = z.array(z.string());
const skillVersionsSchema = z.record(z.string(), z.string());

function tenant(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped message context required.",
    );
  }
  return context.tenant;
}

function parseJson<T>(value: Json, schema: z.ZodType<T>, message: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new RepositoryError("unexpected_response", message, parsed.error);
  }
  return parsed.data;
}

export class SupabaseCampaignMessageRepository implements CampaignMessageRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(context: RepositoryContext) {
    const activeTenant = tenant(context);
    const { data, error } = await this.supabase
      .from("campaign_message_versions")
      .select(
        "*, campaign_messages!inner(campaign_id,campaign_prospect_id,sequence_step_id)",
      )
      .eq("agency_id", activeTenant.agencyId)
      .eq("client_id", activeTenant.clientId)
      .order("created_at", { ascending: false });
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load campaign message variants.",
        error,
      );
    }

    return data.map((row) => ({
      id: row.id,
      messageId: row.message_id,
      campaignId: row.campaign_messages.campaign_id,
      campaignProspectId: row.campaign_messages.campaign_prospect_id,
      sequenceStepId: row.campaign_messages.sequence_step_id,
      versionNumber: row.version_number,
      status: row.status,
      origin: row.origin,
      format: row.format,
      subject: row.subject,
      body: row.body,
      callToAction: row.call_to_action,
      wordCount: row.word_count,
      mainIdea: row.main_idea,
      groundedStatements: parseJson(
        row.grounded_statements,
        z.array(messageGroundedStatementSchema),
        "Stored message grounding is invalid.",
      ),
      missingEvidence: parseJson(
        row.missing_evidence,
        stringListSchema,
        "Stored message evidence gaps are invalid.",
      ),
      skillVersions: parseJson(
        row.skill_versions,
        skillVersionsSchema,
        "Stored message skill versions are invalid.",
      ),
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createVariant(
    input: Parameters<CampaignMessageRepository["createVariant"]>[0],
    context: RepositoryContext,
  ) {
    const activeTenant = tenant(context);
    const payload: Json = {
      messageId: input.messageId,
      campaignId: input.campaignId,
      campaignProspectId: input.campaignProspectId,
      sequenceStepId: input.sequenceStepId,
      origin: input.origin,
      format: input.format,
      subject: input.subject,
      body: input.body,
      callToAction: input.callToAction,
      mainIdea: input.mainIdea,
      groundedStatements: input.groundedStatements,
      missingEvidence: input.missingEvidence,
      inputSnapshot: input.inputSnapshot as Json,
      skillVersions: input.skillVersions,
      aiExecutionId: input.aiExecutionId,
      generationCostMicrousd: input.generationCostMicrousd,
      generationTokens: input.generationTokens,
    };
    const { data, error } = await this.supabase.rpc(
      "create_campaign_message_variant",
      {
        requested_agency_id: activeTenant.agencyId,
        requested_client_id: activeTenant.clientId,
        requested_payload: payload,
      },
    );
    if (error || !data) {
      throw new RepositoryError(
        error?.code === "23505" || error?.code === "23514"
          ? "conflict"
          : "unavailable",
        "Unable to create the message variant.",
        error,
      );
    }
    return data;
  }

  async submitForReview(
    input: Parameters<CampaignMessageRepository["submitForReview"]>[0],
    context: RepositoryContext,
  ) {
    const activeTenant = tenant(context);
    const { data, error } = await this.supabase.rpc(
      "submit_campaign_message_for_review",
      {
        requested_agency_id: activeTenant.agencyId,
        requested_client_id: activeTenant.clientId,
        requested_version_id: input.versionId,
      },
    );
    if (error || !data) {
      throw new RepositoryError(
        error?.code === "55000" ? "conflict" : "unavailable",
        "Unable to submit the message for review.",
        error,
      );
    }
    return data;
  }

  async reviewHuman(
    input: Parameters<CampaignMessageRepository["reviewHuman"]>[0],
    context: RepositoryContext,
  ) {
    const activeTenant = tenant(context);
    const { data, error } = await this.supabase.rpc("review_campaign_message", {
      requested_agency_id: activeTenant.agencyId,
      requested_client_id: activeTenant.clientId,
      requested_version_id: input.versionId,
      requested_review_type: "human",
      requested_decision: input.decision,
      requested_review: { issues: input.issues, scores: {} },
    });
    if (error || !data) {
      throw new RepositoryError(
        error?.code === "55000" ? "conflict" : "unavailable",
        "Unable to record the human message review.",
        error,
      );
    }
    return data;
  }
}
