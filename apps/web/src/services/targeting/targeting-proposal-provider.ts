import type {
  TargetingContent,
  TargetingProfileType,
} from "@/domain/targeting/targeting-profile";

export type TargetingProposalRequest = Readonly<{
  profileType: TargetingProfileType;
  objective: string;
  existingProfileNames: readonly string[];
}>;

export type TargetingProposalResult = Readonly<{
  executionId: string;
  profiles: readonly Readonly<{
    name: string;
    content: TargetingContent;
  }>[];
  modelId: string;
  skillVersion: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costMicrousd: number;
  pricingVersion: string;
}>;

export interface TargetingProposalProvider {
  propose(request: TargetingProposalRequest): Promise<TargetingProposalResult>;
}
