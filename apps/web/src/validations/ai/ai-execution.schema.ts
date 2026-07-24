import { z } from "zod";

import { aiAgentIds, commercialSkillIds } from "@/domain/ai/commercial-skill";
import { aiModelProfiles } from "@/domain/ai/ai-execution";

export const executeCommercialSkillCommandSchema = z.object({
  agentId: z.enum(aiAgentIds),
  skillId: z.enum(commercialSkillIds),
  modelProfile: z.enum(aiModelProfiles).optional(),
  input: z.unknown(),
});

const tokenUsageSchema = z
  .object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  })
  .refine(
    (usage) => usage.totalTokens === usage.inputTokens + usage.outputTokens,
    { message: "Total token usage is inconsistent." },
  );

export const aiTechnicalCostSchema = z.object({
  amountMicrousd: z.number().int().nonnegative(),
  currency: z.literal("USD"),
  pricingVersion: z.string().trim().min(1).max(100),
});

export const aiProviderResponseSchema = z.object({
  modelId: z.string().trim().min(1).max(200),
  output: z.unknown(),
  usage: tokenUsageSchema,
});
