export const onboardingSectionKeys = [
  "company_information",
  "products_services",
  "current_offer",
  "pricing",
  "existing_customers",
  "customer_cases",
  "available_proofs",
  "competitors",
  "problems_solved",
  "sales_process",
  "target_markets",
  "objectives",
  "existing_channels",
  "available_integrations",
] as const;

export type OnboardingSectionKey = (typeof onboardingSectionKeys)[number];

export const onboardingStatuses = ["draft", "completed", "validated"] as const;

export type OnboardingStatus = (typeof onboardingStatuses)[number];

export type OnboardingAnswerValue =
  string | number | boolean | null | readonly string[];

export type OnboardingAnswerData = Readonly<
  Record<string, OnboardingAnswerValue>
>;

export type OnboardingAnswer = Readonly<{
  id: string;
  sectionKey: OnboardingSectionKey;
  data: OnboardingAnswerData;
  isComplete: boolean;
  revision: number;
  updatedAt: string;
}>;

export type OnboardingHistoryEntry = Readonly<{
  id: number;
  sectionKey: OnboardingSectionKey;
  revision: number;
  isComplete: boolean;
  changedBy: string;
  changedAt: string;
}>;

export type OnboardingSession = Readonly<{
  id: string | null;
  agencyId: string;
  clientId: string;
  status: OnboardingStatus;
  currentStep: number;
  completedStepCount: number;
  completedAt: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  updatedAt: string | null;
  answers: Readonly<Partial<Record<OnboardingSectionKey, OnboardingAnswer>>>;
  history: readonly OnboardingHistoryEntry[];
}>;

export function getOnboardingProgress(completedStepCount: number): number {
  return Math.round(
    (Math.min(Math.max(completedStepCount, 0), onboardingSectionKeys.length) /
      onboardingSectionKeys.length) *
      100,
  );
}
