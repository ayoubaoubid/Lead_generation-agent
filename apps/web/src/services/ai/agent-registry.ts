import type { AgentCapabilityId } from "@/domain/ai/agent-capability";
import type {
  AiAgentId,
  CommercialSkillId,
} from "@/domain/ai/commercial-skill";

export type AiAgentDefinition = Readonly<{
  id: AiAgentId;
  version: string;
  mission: string;
  allowedSkills: readonly CommercialSkillId[];
  allowedCapabilities: readonly AgentCapabilityId[];
  requiresHumanApprovalForEffects: true;
}>;

export const aiAgentRegistry: Readonly<Record<AiAgentId, AiAgentDefinition>> = {
  "orchestrator-agent": {
    id: "orchestrator-agent",
    version: "1.0.0",
    mission:
      "Sélectionner un workflow et recommander des skills sans exécuter seul un effet externe.",
    allowedSkills: [
      "diagnose",
      "four-steps",
      "lean-startup",
      "obviously-awesome",
      "100m-offers",
      "100m-leads",
    ],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "onboarding-agent": {
    id: "onboarding-agent",
    version: "1.0.0",
    mission:
      "Identifier les informations commerciales manquantes dans un onboarding validé.",
    allowedSkills: ["mom-test", "four-steps", "100m-offers"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "strategy-agent": {
    id: "strategy-agent",
    version: "1.0.0",
    mission: "Structurer les hypothèses et expériences stratégiques.",
    allowedSkills: ["diagnose", "four-steps", "lean-startup"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "positioning-agent": {
    id: "positioning-agent",
    version: "1.0.0",
    mission: "Préparer un positionnement fondé sur les preuves disponibles.",
    allowedSkills: ["obviously-awesome"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "icp-agent": {
    id: "icp-agent",
    version: "1.0.0",
    mission: "Préparer les critères ICP et les exclusions à faire valider.",
    allowedSkills: ["mom-test", "obviously-awesome"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "acquisition-strategy-agent": {
    id: "acquisition-strategy-agent",
    version: "1.0.0",
    mission: "Préparer des tests de canaux sans lancer les opérations.",
    allowedSkills: ["100m-leads", "lean-startup", "diagnose"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "personalization-agent": {
    id: "personalization-agent",
    version: "1.0.0",
    mission:
      "Préparer des messages fondés uniquement sur des faits disponibles.",
    allowedSkills: [
      "storybrand",
      "obviously-awesome",
      "100m-offers",
      "cold-email-personalization",
    ],
    allowedCapabilities: ["message_personalization"],
    requiresHumanApprovalForEffects: true,
  },
  "message-quality-agent": {
    id: "message-quality-agent",
    version: "1.0.0",
    mission: "Réviser la clarté, la crédibilité et le risque d’exagération.",
    allowedSkills: ["made-to-stick"],
    allowedCapabilities: ["message_quality_review"],
    requiresHumanApprovalForEffects: true,
  },
  "sales-assistant-agent": {
    id: "sales-assistant-agent",
    version: "1.0.0",
    mission: "Préparer les rendez-vous et prochaines questions commerciales.",
    allowedSkills: ["spin-selling", "100m-offers"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "analytics-agent": {
    id: "analytics-agent",
    version: "1.0.0",
    mission:
      "Diagnostiquer les performances et proposer des expériences vérifiables.",
    allowedSkills: ["diagnose", "lean-startup"],
    allowedCapabilities: [],
    requiresHumanApprovalForEffects: true,
  },
  "lead-research-agent": {
    id: "lead-research-agent",
    version: "1.0.0",
    mission:
      "Analyser les sources autorisées pour proposer des entreprises et contacts sans vérifier ni envoyer.",
    allowedSkills: [],
    allowedCapabilities: ["company_research", "contact_research"],
    requiresHumanApprovalForEffects: true,
  },
  "qualification-agent": {
    id: "qualification-agent",
    version: "1.0.0",
    mission:
      "Expliquer la qualification d’un lead à partir de données rechargées et de critères versionnés.",
    allowedSkills: [],
    allowedCapabilities: ["lead_qualification"],
    requiresHumanApprovalForEffects: true,
  },
  "reply-agent": {
    id: "reply-agent",
    version: "1.0.0",
    mission:
      "Classifier une réponse entrante et proposer un brouillon sans envoyer automatiquement.",
    allowedSkills: ["reply-classification", "objection-handling"],
    allowedCapabilities: ["reply_classification", "reply_drafting"],
    requiresHumanApprovalForEffects: true,
  },
  "compliance-agent": {
    id: "compliance-agent",
    version: "1.0.0",
    mission:
      "Relever les risques de conformité d’un message sans décider seul de son éligibilité à l’envoi.",
    allowedSkills: ["message-compliance-review"],
    allowedCapabilities: ["compliance_review"],
    requiresHumanApprovalForEffects: true,
  },
};

export function agentCanUseSkill(
  agentId: AiAgentId,
  skillId: CommercialSkillId,
): boolean {
  return aiAgentRegistry[agentId].allowedSkills.includes(skillId);
}

export function agentCanUseCapability(
  agentId: AiAgentId,
  capabilityId: AgentCapabilityId,
): boolean {
  return aiAgentRegistry[agentId].allowedCapabilities.includes(capabilityId);
}
