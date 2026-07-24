import type {
  AiAgentId,
  CommercialSkillId,
} from "@/domain/ai/commercial-skill";

export type AiAgentDefinition = Readonly<{
  id: AiAgentId;
  version: string;
  mission: string;
  allowedSkills: readonly CommercialSkillId[];
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
    requiresHumanApprovalForEffects: true,
  },
  "onboarding-agent": {
    id: "onboarding-agent",
    version: "1.0.0",
    mission:
      "Identifier les informations commerciales manquantes dans un onboarding validé.",
    allowedSkills: ["mom-test", "four-steps", "100m-offers"],
    requiresHumanApprovalForEffects: true,
  },
  "strategy-agent": {
    id: "strategy-agent",
    version: "1.0.0",
    mission: "Structurer les hypothèses et expériences stratégiques.",
    allowedSkills: ["diagnose", "four-steps", "lean-startup"],
    requiresHumanApprovalForEffects: true,
  },
  "positioning-agent": {
    id: "positioning-agent",
    version: "1.0.0",
    mission: "Préparer un positionnement fondé sur les preuves disponibles.",
    allowedSkills: ["obviously-awesome"],
    requiresHumanApprovalForEffects: true,
  },
  "icp-agent": {
    id: "icp-agent",
    version: "1.0.0",
    mission: "Préparer les critères ICP et les exclusions à faire valider.",
    allowedSkills: ["mom-test", "obviously-awesome"],
    requiresHumanApprovalForEffects: true,
  },
  "acquisition-strategy-agent": {
    id: "acquisition-strategy-agent",
    version: "1.0.0",
    mission: "Préparer des tests de canaux sans lancer les opérations.",
    allowedSkills: ["100m-leads", "lean-startup", "diagnose"],
    requiresHumanApprovalForEffects: true,
  },
  "personalization-agent": {
    id: "personalization-agent",
    version: "1.0.0",
    mission:
      "Préparer des messages fondés uniquement sur des faits disponibles.",
    allowedSkills: ["storybrand", "obviously-awesome", "100m-offers"],
    requiresHumanApprovalForEffects: true,
  },
  "message-quality-agent": {
    id: "message-quality-agent",
    version: "1.0.0",
    mission: "Réviser la clarté, la crédibilité et le risque d’exagération.",
    allowedSkills: ["made-to-stick"],
    requiresHumanApprovalForEffects: true,
  },
  "sales-assistant-agent": {
    id: "sales-assistant-agent",
    version: "1.0.0",
    mission: "Préparer les rendez-vous et prochaines questions commerciales.",
    allowedSkills: ["spin-selling", "100m-offers"],
    requiresHumanApprovalForEffects: true,
  },
  "analytics-agent": {
    id: "analytics-agent",
    version: "1.0.0",
    mission:
      "Diagnostiquer les performances et proposer des expériences vérifiables.",
    allowedSkills: ["diagnose", "lean-startup"],
    requiresHumanApprovalForEffects: true,
  },
};

export function agentCanUseSkill(
  agentId: AiAgentId,
  skillId: CommercialSkillId,
): boolean {
  return aiAgentRegistry[agentId].allowedSkills.includes(skillId);
}
