export const commercialSkillIds = [
  "diagnose",
  "mom-test",
  "four-steps",
  "lean-startup",
  "obviously-awesome",
  "100m-offers",
  "100m-leads",
  "spin-selling",
  "storybrand",
  "made-to-stick",
  "cold-email-personalization",
  "message-compliance-review",
  "reply-classification",
  "objection-handling",
] as const;

export type CommercialSkillId = (typeof commercialSkillIds)[number];

export const aiAgentIds = [
  "orchestrator-agent",
  "onboarding-agent",
  "strategy-agent",
  "positioning-agent",
  "icp-agent",
  "acquisition-strategy-agent",
  "personalization-agent",
  "message-quality-agent",
  "sales-assistant-agent",
  "analytics-agent",
  "lead-research-agent",
  "qualification-agent",
  "reply-agent",
  "compliance-agent",
] as const;

export type AiAgentId = (typeof aiAgentIds)[number];
