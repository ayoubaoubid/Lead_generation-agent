import type { CampaignMessageVariant } from "@/domain/messages/campaign-message";
import type { RepositoryContext } from "@/repositories/repository-context";
import type {
  CreateCampaignMessageVariantInput,
  HumanMessageReviewInput,
  SubmitCampaignMessageInput,
} from "@/validations/messages/campaign-message.schema";

export interface CampaignMessageRepository {
  list(context: RepositoryContext): Promise<readonly CampaignMessageVariant[]>;
  createVariant(
    input: CreateCampaignMessageVariantInput,
    context: RepositoryContext,
  ): Promise<string>;
  submitForReview(
    input: SubmitCampaignMessageInput,
    context: RepositoryContext,
  ): Promise<string>;
  reviewHuman(
    input: HumanMessageReviewInput,
    context: RepositoryContext,
  ): Promise<string>;
}
