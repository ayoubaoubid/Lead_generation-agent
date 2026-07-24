import type {
  OnboardingAnswerData,
  OnboardingSectionKey,
  OnboardingSession,
} from "@/domain/onboarding/onboarding";
import type { RepositoryContext } from "@/repositories/repository-context";

export type SaveOnboardingStepRecord = Readonly<{
  sectionKey: OnboardingSectionKey;
  data: OnboardingAnswerData;
  isComplete: boolean;
  currentStep: number;
}>;

export interface OnboardingRepository {
  find(context: RepositoryContext): Promise<OnboardingSession>;
  saveStep(
    input: SaveOnboardingStepRecord,
    context: RepositoryContext,
  ): Promise<string>;
  complete(context: RepositoryContext): Promise<string>;
  validate(context: RepositoryContext): Promise<string>;
}
