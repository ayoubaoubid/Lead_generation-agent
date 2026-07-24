export const strategyArtifactTypes = ["positioning", "offer"] as const;
export type StrategyArtifactType = (typeof strategyArtifactTypes)[number];

export const strategyClaimStatuses = [
  "confirmed",
  "inferred",
  "hypothesis",
  "missing",
] as const;
export type StrategyClaimStatus = (typeof strategyClaimStatuses)[number];

export const positioningItemKinds = [
  "positioning_statement",
  "competitive_alternative",
  "unique_capability",
  "customer_value",
  "best_fit_segment",
  "market_category",
  "proof_point",
  "excluded_segment",
  "differentiator",
] as const;

export const offerItemKinds = [
  "desired_result",
  "promise",
  "guarantee",
  "timeline",
  "objection",
  "proof_point",
  "obstacle",
  "bonus",
  "differentiator",
] as const;

export const strategyItemKinds = [
  ...positioningItemKinds,
  "desired_result",
  "promise",
  "guarantee",
  "timeline",
  "objection",
  "obstacle",
  "bonus",
] as const;

export type PositioningItemKind = (typeof positioningItemKinds)[number];
export type OfferItemKind = (typeof offerItemKinds)[number];
export type StrategyItemKind = (typeof strategyItemKinds)[number];

export const strategyEvidenceTypes = [
  "customer_case",
  "testimonial",
  "statistic",
  "document",
  "internal_data",
  "authorization",
  "other",
] as const;
export type StrategyEvidenceType = (typeof strategyEvidenceTypes)[number];

export type StrategyContentItem = Readonly<{
  kind: StrategyItemKind;
  value: string;
  classification: StrategyClaimStatus;
  evidenceIds: readonly string[];
}>;

export type StrategyEvidence = Readonly<{
  id: string;
  evidenceType: StrategyEvidenceType;
  title: string;
  description: string;
  classification: Exclude<StrategyClaimStatus, "missing">;
  sourceUrl: string | null;
  sourceReference: string | null;
  createdAt: string;
}>;

export type StrategyVersion = Readonly<{
  id: string;
  artifactId: string;
  versionNumber: number;
  status: "draft" | "validated";
  content: readonly StrategyContentItem[];
  framework: "obviously-awesome" | "100m-offers";
  frameworkVersion: string;
  validatedBy: string | null;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type StrategyArtifact = Readonly<{
  id: string;
  artifactType: StrategyArtifactType;
  name: string;
  createdAt: string;
  updatedAt: string;
  versions: readonly StrategyVersion[];
}>;

export type StrategyWorkspace = Readonly<{
  artifacts: readonly StrategyArtifact[];
  evidence: readonly StrategyEvidence[];
}>;
