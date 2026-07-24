import type {
  OnboardingAnswerData,
  OnboardingSectionKey,
  OnboardingSession,
} from "./onboarding";

export const onboardingSkillKeys = [
  "mom_test",
  "four_steps",
  "obviously_awesome",
  "100m_offers",
  "100m_leads",
] as const;

export type OnboardingSkillKey = (typeof onboardingSkillKeys)[number];

export type OnboardingSkillContext = Readonly<{
  skillKey: OnboardingSkillKey;
  sourceSessionId: string;
  sourceStatus: "completed" | "validated";
  sections: Readonly<
    Partial<Record<OnboardingSectionKey, OnboardingAnswerData>>
  >;
}>;

const skillSections: Readonly<
  Record<OnboardingSkillKey, readonly OnboardingSectionKey[]>
> = {
  mom_test: [
    "existing_customers",
    "customer_cases",
    "problems_solved",
    "target_markets",
    "objectives",
  ],
  four_steps: [
    "company_information",
    "products_services",
    "existing_customers",
    "customer_cases",
    "available_proofs",
    "sales_process",
    "objectives",
  ],
  obviously_awesome: [
    "products_services",
    "current_offer",
    "pricing",
    "existing_customers",
    "available_proofs",
    "competitors",
    "problems_solved",
    "target_markets",
  ],
  "100m_offers": [
    "products_services",
    "current_offer",
    "pricing",
    "customer_cases",
    "available_proofs",
    "problems_solved",
    "objectives",
  ],
  "100m_leads": [
    "existing_customers",
    "target_markets",
    "objectives",
    "existing_channels",
    "available_integrations",
  ],
};

export function buildOnboardingSkillContexts(
  session: OnboardingSession,
): readonly OnboardingSkillContext[] {
  if (!session.id || session.status === "draft") {
    return [];
  }

  const sourceStatus: "completed" | "validated" = session.status;

  return onboardingSkillKeys.map((skillKey) => {
    const sections = Object.fromEntries(
      skillSections[skillKey].flatMap((sectionKey) => {
        const answer = session.answers[sectionKey];
        return answer?.isComplete ? [[sectionKey, answer.data]] : [];
      }),
    ) as Partial<Record<OnboardingSectionKey, OnboardingAnswerData>>;

    return {
      skillKey,
      sourceSessionId: session.id as string,
      sourceStatus,
      sections,
    };
  });
}
