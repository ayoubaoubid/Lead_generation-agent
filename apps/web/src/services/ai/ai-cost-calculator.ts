import type { AiTechnicalCost, AiTokenUsage } from "@/domain/ai/ai-execution";

export interface AiCostCalculator {
  calculate(
    request: Readonly<{
      modelId: string;
      usage: AiTokenUsage;
    }>,
  ): AiTechnicalCost;
}
