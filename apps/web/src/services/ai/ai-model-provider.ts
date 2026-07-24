import type { AiModelProfile, AiTokenUsage } from "@/domain/ai/ai-execution";

export type AiStructuredGenerationRequest = Readonly<{
  executionId: string;
  systemPrompt: string;
  input: unknown;
  modelProfile: AiModelProfile;
  maxInputTokens: number;
  maxOutputTokens: number;
  signal: AbortSignal;
}>;

export type AiStructuredGenerationResponse = Readonly<{
  modelId: string;
  output: unknown;
  usage: AiTokenUsage;
}>;

export interface AiModelProvider {
  generateStructured(
    request: AiStructuredGenerationRequest,
  ): Promise<AiStructuredGenerationResponse>;
}

export class AiModelProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly providerCode?: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiModelProviderError";
  }
}
