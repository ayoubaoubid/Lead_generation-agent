export const scoreComponents = [
  "fit",
  "intent",
  "data_quality",
  "engagement",
] as const;

export type ScoreComponent = (typeof scoreComponents)[number];

export const scoreFields = [
  "industry",
  "country",
  "employee_count",
  "annual_revenue",
  "technologies",
  "persona",
  "offer",
  "language",
  "problems",
  "intent_signals",
  "maturity",
  "data_quality",
  "engagement_points",
] as const;

export type ScoreField = (typeof scoreFields)[number];

export const scoreOperators = [
  "equals",
  "includes",
  "in",
  "gte",
  "lte",
  "between",
  "exists",
] as const;

export type ScoreOperator = (typeof scoreOperators)[number];

export type LeadScoringInput = Readonly<{
  industry: string | null;
  country: string | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  technologies: readonly string[];
  personaIds: readonly string[];
  offerIds: readonly string[];
  languages: readonly string[];
  problems: readonly string[];
  intentSignals: readonly string[];
  maturity: string | null;
  dataQuality: number | null;
  engagementPoints: number | null;
}>;

export type ScoreCriterionExplanation = Readonly<{
  ruleId: string;
  component: ScoreComponent;
  field: ScoreField;
  weight: number;
  matched: boolean;
  missing: boolean;
}>;

export type DeterministicScoreResult = Readonly<{
  fitScore: number;
  intentScore: number;
  dataQualityScore: number;
  engagementScore: number;
  totalScore: number;
  confidenceScore: number;
  satisfiedCriteria: readonly string[];
  missingCriteria: readonly string[];
  appliedWeights: Readonly<Record<string, number>>;
  explanation: readonly ScoreCriterionExplanation[];
  nextAction: "prioritize" | "nurture" | "exclude" | "collect_missing_data";
}>;
