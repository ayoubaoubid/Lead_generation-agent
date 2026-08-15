import type { CampaignRepository } from "@/repositories/contracts/campaign.repository";
import type { ServiceContext } from "@/services/service-context";
import type {
  CampaignTransitionInput,
  CreateCampaignDraftInput,
} from "@/validations/campaigns/campaign.schema";

export class CampaignService {
  constructor(private readonly repository: CampaignRepository) {}

  list(context: ServiceContext) {
    return this.repository.list(context);
  }

  createDraft(input: CreateCampaignDraftInput, context: ServiceContext) {
    return this.repository.createDraft(input, context);
  }

  transition(input: CampaignTransitionInput, context: ServiceContext) {
    return this.repository.transition(input, context);
  }
}
