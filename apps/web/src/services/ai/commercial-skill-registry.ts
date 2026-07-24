import type { ZodType } from "zod";

import type { CommercialSkillId } from "@/domain/ai/commercial-skill";
import type {
  AiExecutionLimits,
  AiModelProfile,
} from "@/domain/ai/ai-execution";
import { commercialSkillSchemas } from "@/validations/ai/commercial-skill.schemas";

export type SkillDefinition = Readonly<{
  id: CommercialSkillId;
  version: string;
  category: "quality" | "sales" | "strategy";
  promptVersion: string;
  promptPath: string;
  defaultModelProfile: AiModelProfile;
  allowedModelProfiles: readonly AiModelProfile[];
  limits: AiExecutionLimits;
  inputSchema: ZodType;
  outputSchema: ZodType;
}>;

const standardLimits: AiExecutionLimits = {
  maxInputTokens: 12_000,
  maxOutputTokens: 3_000,
  timeoutMs: 45_000,
  maxAttempts: 2,
  retryBackoffMs: 500,
};

const reasoningLimits: AiExecutionLimits = {
  maxInputTokens: 16_000,
  maxOutputTokens: 4_000,
  timeoutMs: 60_000,
  maxAttempts: 2,
  retryBackoffMs: 750,
};

const categoryBySkill: Readonly<
  Record<CommercialSkillId, SkillDefinition["category"]>
> = {
  diagnose: "strategy",
  "mom-test": "strategy",
  "four-steps": "strategy",
  "lean-startup": "strategy",
  "obviously-awesome": "strategy",
  "100m-offers": "strategy",
  "100m-leads": "strategy",
  "spin-selling": "sales",
  storybrand: "sales",
  "made-to-stick": "quality",
};

const reasoningSkills = new Set<CommercialSkillId>([
  "diagnose",
  "four-steps",
  "lean-startup",
  "obviously-awesome",
  "100m-offers",
]);

function defineSkill(skillId: CommercialSkillId): SkillDefinition {
  const category = categoryBySkill[skillId];
  const useReasoningProfile = reasoningSkills.has(skillId);

  return {
    id: skillId,
    version: "1.0.0",
    category,
    promptVersion: "1",
    promptPath: `.codex/skills/${category}/${skillId}/prompts/system.v1.md`,
    defaultModelProfile: useReasoningProfile ? "reasoning" : "balanced",
    allowedModelProfiles: useReasoningProfile
      ? (["balanced", "reasoning"] as const)
      : (["fast", "balanced", "reasoning"] as const),
    limits: useReasoningProfile ? reasoningLimits : standardLimits,
    inputSchema: commercialSkillSchemas[skillId].input,
    outputSchema: commercialSkillSchemas[skillId].output,
  };
}

export const commercialSkillRegistry = {
  diagnose: defineSkill("diagnose"),
  "mom-test": defineSkill("mom-test"),
  "four-steps": defineSkill("four-steps"),
  "lean-startup": defineSkill("lean-startup"),
  "obviously-awesome": defineSkill("obviously-awesome"),
  "100m-offers": defineSkill("100m-offers"),
  "100m-leads": defineSkill("100m-leads"),
  "spin-selling": defineSkill("spin-selling"),
  storybrand: defineSkill("storybrand"),
  "made-to-stick": defineSkill("made-to-stick"),
} satisfies Record<CommercialSkillId, SkillDefinition>;

export function getCommercialSkillDefinition(
  skillId: CommercialSkillId,
): SkillDefinition {
  return commercialSkillRegistry[skillId];
}
