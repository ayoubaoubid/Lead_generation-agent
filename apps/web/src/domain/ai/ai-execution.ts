export const aiExecutionStatuses = [
  "queued",
  "running",
  "retrying",
  "succeeded",
  "failed",
  "timed_out",
  "cancelled",
] as const;

export type AiExecutionStatus = (typeof aiExecutionStatuses)[number];

export const aiModelProfiles = ["fast", "balanced", "reasoning"] as const;

export type AiModelProfile = (typeof aiModelProfiles)[number];

export const evidenceClassifications = [
  "confirmed_fact",
  "extracted_fact",
  "estimate",
  "hypothesis",
  "unverified",
] as const;

export type EvidenceClassification = (typeof evidenceClassifications)[number];

export type AiTokenUsage = Readonly<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}>;

export type AiTechnicalCost = Readonly<{
  amountMicrousd: number;
  currency: "USD";
  pricingVersion: string;
}>;

export type AiExecutionLimits = Readonly<{
  maxInputTokens: number;
  maxOutputTokens: number;
  timeoutMs: number;
  maxAttempts: number;
  retryBackoffMs: number;
}>;

export type AiExecutionResult = Readonly<{
  executionId: string;
  status: "succeeded";
  agentId: string;
  agentVersion: string;
  skillId: string;
  skillVersion: string;
  promptVersion: string;
  modelId: string;
  modelProfile: AiModelProfile;
  output: unknown;
  usage: AiTokenUsage;
  technicalCost: AiTechnicalCost;
  attempts: number;
  startedAt: string;
  completedAt: string;
}>;

export type AiExecutionFailureCode =
  | "agent_not_allowed"
  | "cancelled"
  | "input_invalid"
  | "output_invalid"
  | "provider_failed"
  | "skill_not_found"
  | "timed_out";

export class AiExecutionError extends Error {
  constructor(
    readonly code: AiExecutionFailureCode,
    message: string,
    readonly retryable: boolean,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiExecutionError";
  }
}
