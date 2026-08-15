import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CampaignRepository } from "@/repositories/contracts/campaign.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";

function tenant(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped campaign context required.",
    );
  }
  return context.tenant;
}

export class SupabaseCampaignRepository implements CampaignRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(context: RepositoryContext) {
    const activeTenant = tenant(context);
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("agency_id", activeTenant.agencyId)
      .eq("client_id", activeTenant.clientId)
      .order("updated_at", { ascending: false });
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load campaigns.",
        error,
      );
    }
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      objective: row.objective,
      status: row.status,
      channel: row.channel,
      timezone: row.timezone,
      offerId: row.offer_id,
      icpId: row.icp_id,
      segmentId: row.segment_id,
      scheduledStartAt: row.scheduled_start_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createDraft(
    input: Parameters<CampaignRepository["createDraft"]>[0],
    context: RepositoryContext,
  ) {
    const activeTenant = tenant(context);
    const payload: Json = {
      name: input.name,
      objective: input.objective,
      channel: input.channel,
      timezone: input.timezone,
      offerId: input.offerId,
      icpId: input.icpId,
      segmentId: input.segmentId,
      personaIds: input.personaIds,
      sequenceName: input.sequenceName,
      templateSubject: input.templateSubject,
      templateBody: input.templateBody,
    };
    const { data, error } = await this.supabase.rpc("create_campaign_draft", {
      requested_agency_id: activeTenant.agencyId,
      requested_client_id: activeTenant.clientId,
      requested_payload: payload,
    });
    if (error || !data) {
      throw new RepositoryError(
        error?.code === "23505" ? "conflict" : "unavailable",
        "Unable to create the campaign draft.",
        error,
      );
    }
    return data;
  }

  async transition(
    input: Parameters<CampaignRepository["transition"]>[0],
    context: RepositoryContext,
  ) {
    const activeTenant = tenant(context);
    const { data, error } = await this.supabase.rpc("transition_campaign", {
      requested_agency_id: activeTenant.agencyId,
      requested_client_id: activeTenant.clientId,
      requested_campaign_id: input.campaignId,
      requested_action: input.action,
      ...(input.scheduledStartAt
        ? { requested_start_at: input.scheduledStartAt }
        : {}),
    });
    if (error || !data) {
      throw new RepositoryError(
        error?.code === "55000" ? "conflict" : "unavailable",
        "Unable to transition the campaign.",
        error,
      );
    }
    return data;
  }
}
