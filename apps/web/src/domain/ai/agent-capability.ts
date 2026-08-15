export const agentCapabilityIds = [
  "company_research",
  "contact_research",
  "lead_qualification",
  "message_personalization",
  "message_quality_review",
  "compliance_review",
  "reply_classification",
  "reply_drafting",
] as const;

export type AgentCapabilityId = (typeof agentCapabilityIds)[number];

export const deterministicServiceIds = [
  "company_enrichment",
  "contact_enrichment",
  "data_normalization",
  "deduplication",
  "email_verification",
  "reply_ingestion",
  "sequence_stop",
  "outreach_send",
] as const;

export type DeterministicServiceId = (typeof deterministicServiceIds)[number];
