import type { CampaignSummary } from "@/domain/campaigns/campaign";
import type { RepositoryContext } from "@/repositories/repository-context";
import type {
  CampaignTransitionInput,
  CreateCampaignDraftInput,
} from "@/validations/campaigns/campaign.schema";

export interface CampaignRepository {
  list(context: RepositoryContext): Promise<readonly CampaignSummary[]>;
  createDraft(
    input: CreateCampaignDraftInput,
    context: RepositoryContext,
  ): Promise<string>;
  transition(
    input: CampaignTransitionInput,
    context: RepositoryContext,
  ): Promise<string>;
}
