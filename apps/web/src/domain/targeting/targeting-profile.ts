export const targetingProfileTypes = ["icp", "persona"] as const;
export type TargetingProfileType = (typeof targetingProfileTypes)[number];

export const targetingLifecycleStatuses = [
  "inactive",
  "active",
  "archived",
] as const;
export type TargetingLifecycleStatus =
  (typeof targetingLifecycleStatuses)[number];

export const targetingVersionStatuses = ["draft", "validated"] as const;
export type TargetingVersionStatus = (typeof targetingVersionStatuses)[number];

export const targetingVersionOrigins = [
  "manual",
  "ai_proposal",
  "duplicate",
] as const;
export type TargetingVersionOrigin = (typeof targetingVersionOrigins)[number];

export const scoringCriteria = [
  "industry",
  "country",
  "company_size",
  "employee_count",
  "annual_revenue",
  "technology",
  "maturity",
  "budget",
  "problem",
  "intent_signal",
] as const;
export type ScoringCriterion = (typeof scoringCriteria)[number];

export type NumericRange = Readonly<{
  min: number | null;
  max: number | null;
}>;

export type MoneyRange = NumericRange &
  Readonly<{
    currencyCode: string;
  }>;

export type IcpContent = Readonly<{
  rationale: readonly string[];
  industries: readonly string[];
  countries: readonly string[];
  companySizes: readonly string[];
  employeeCount: NumericRange;
  annualRevenue: MoneyRange;
  technologies: readonly string[];
  maturityLevels: readonly string[];
  budget: MoneyRange;
  problems: readonly string[];
  intentSignals: readonly string[];
  exclusions: readonly string[];
  scoringWeights: readonly Readonly<{
    criterion: ScoringCriterion;
    weight: number;
  }>[];
  assumptions: readonly string[];
  missingEvidence: readonly string[];
}>;

export const decisionPowerLevels = [
  "low",
  "medium",
  "high",
  "unknown",
] as const;
export type DecisionPowerLevel = (typeof decisionPowerLevels)[number];

export type PersonaContent = Readonly<{
  rationale: readonly string[];
  jobTitles: readonly string[];
  departments: readonly string[];
  seniorityLevels: readonly string[];
  responsibilities: readonly string[];
  goals: readonly string[];
  problems: readonly string[];
  objections: readonly string[];
  decisionPower: DecisionPowerLevel;
  buyingRoles: readonly string[];
  preferredChannels: readonly string[];
  assumptions: readonly string[];
  missingEvidence: readonly string[];
}>;

export type TargetingContent = IcpContent | PersonaContent;

export type TargetingVersion = Readonly<{
  id: string;
  profileId: string;
  versionNumber: number;
  status: TargetingVersionStatus;
  origin: TargetingVersionOrigin;
  content: TargetingContent;
  sourceVersionId: string | null;
  aiExecutionId: string | null;
  aiModelId: string | null;
  aiSkillName: string | null;
  aiSkillVersion: string | null;
  aiPromptVersion: string | null;
  aiInputTokens: number | null;
  aiOutputTokens: number | null;
  aiCostMicrousd: number | null;
  validatedBy: string | null;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type TargetingProfile = Readonly<{
  id: string;
  profileType: TargetingProfileType;
  name: string;
  lifecycleStatus: TargetingLifecycleStatus;
  activatedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  versions: readonly TargetingVersion[];
}>;

export type TargetingWorkspace = Readonly<{
  profiles: readonly TargetingProfile[];
}>;
