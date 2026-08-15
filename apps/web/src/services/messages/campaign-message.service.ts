import type { CampaignMessageRepository } from "@/repositories/contracts/campaign-message.repository";
import type { ServiceContext } from "@/services/service-context";
import type {
  CreateCampaignMessageVariantInput,
  HumanMessageReviewInput,
  SubmitCampaignMessageInput,
} from "@/validations/messages/campaign-message.schema";

export class CampaignMessageService {
  constructor(private readonly repository: CampaignMessageRepository) {}

  list(context: ServiceContext) {
    return this.repository.list(context);
  }

  createVariant(
    input: CreateCampaignMessageVariantInput,
    context: ServiceContext,
  ) {
    return this.repository.createVariant(input, context);
  }

  submitForReview(input: SubmitCampaignMessageInput, context: ServiceContext) {
    return this.repository.submitForReview(input, context);
  }

  reviewHuman(input: HumanMessageReviewInput, context: ServiceContext) {
    return this.repository.reviewHuman(input, context);
  }
}
