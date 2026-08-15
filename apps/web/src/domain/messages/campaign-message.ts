import type { EvidenceClassification } from "@/domain/ai/ai-execution";

export const campaignMessageStatuses = [
  "draft",
  "quality_review_pending",
  "compliance_review_pending",
  "human_review_pending",
  "approved",
  "rejected",
] as const;

export type CampaignMessageStatus = (typeof campaignMessageStatuses)[number];

export const messageFormats = [
  "cold_email",
  "follow_up",
  "linkedin_message",
] as const;

export type MessageFormat = (typeof messageFormats)[number];

export type MessageGroundedStatement = Readonly<{
  statement: string;
  classification: EvidenceClassification;
  confidence: number;
  sourceReferenceIds: readonly string[];
}>;

export type CampaignMessageVariant = Readonly<{
  id: string;
  messageId: string;
  campaignId: string;
  campaignProspectId: string;
  sequenceStepId: string;
  versionNumber: number;
  status: CampaignMessageStatus;
  origin: "ai_generated" | "human_edit" | "regenerated";
  format: MessageFormat;
  subject: string | null;
  body: string;
  callToAction: string;
  wordCount: number;
  mainIdea: string;
  groundedStatements: readonly MessageGroundedStatement[];
  missingEvidence: readonly string[];
  skillVersions: Readonly<Record<string, string>>;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;
