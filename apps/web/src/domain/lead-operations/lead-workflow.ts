import type {
  AgentCapabilityId,
  DeterministicServiceId,
} from "@/domain/ai/agent-capability";
import type { AiAgentId } from "@/domain/ai/commercial-skill";

export const leadWorkflowTypes = ["lead_outreach", "inbound_reply"] as const;

export type LeadWorkflowType = (typeof leadWorkflowTypes)[number];

export type AgentWorkflowExecutor = Readonly<{
  kind: "agent";
  agentId: AiAgentId;
  capabilityId: AgentCapabilityId;
}>;

export type ServiceWorkflowExecutor = Readonly<{
  kind: "service";
  serviceId: DeterministicServiceId;
  effect: "internal" | "external";
}>;

export type HumanGateWorkflowExecutor = Readonly<{
  kind: "human_gate";
  gateId: "message_approval" | "reply_approval";
}>;

export type WorkflowExecutor =
  AgentWorkflowExecutor | ServiceWorkflowExecutor | HumanGateWorkflowExecutor;

export type LeadWorkflowStep = Readonly<{
  stepId: string;
  title: string;
  dependsOn: readonly string[];
  executor: WorkflowExecutor;
}>;

export type LeadWorkflowDefinition = Readonly<{
  workflowType: LeadWorkflowType;
  version: string;
  steps: readonly LeadWorkflowStep[];
}>;

export class WorkflowDefinitionError extends Error {
  constructor(
    readonly code:
      | "dependency_cycle"
      | "duplicate_step"
      | "external_effect_not_gated"
      | "invalid_executor"
      | "missing_dependency"
      | "missing_required_step",
    message: string,
  ) {
    super(message);
    this.name = "WorkflowDefinitionError";
  }
}

export const leadOutreachWorkflowDefinition = {
  workflowType: "lead_outreach",
  version: "1.0.0",
  steps: [
    {
      stepId: "research_company",
      title: "Research the company",
      dependsOn: [],
      executor: {
        kind: "agent",
        agentId: "lead-research-agent",
        capabilityId: "company_research",
      },
    },
    {
      stepId: "research_contact",
      title: "Research the contact",
      dependsOn: ["research_company"],
      executor: {
        kind: "agent",
        agentId: "lead-research-agent",
        capabilityId: "contact_research",
      },
    },
    {
      stepId: "enrich_company",
      title: "Enrich company data",
      dependsOn: ["research_company"],
      executor: {
        kind: "service",
        serviceId: "company_enrichment",
        effect: "internal",
      },
    },
    {
      stepId: "enrich_contact",
      title: "Enrich contact data",
      dependsOn: ["research_contact", "enrich_company"],
      executor: {
        kind: "service",
        serviceId: "contact_enrichment",
        effect: "internal",
      },
    },
    {
      stepId: "normalize_data",
      title: "Normalize collected data",
      dependsOn: ["enrich_contact"],
      executor: {
        kind: "service",
        serviceId: "data_normalization",
        effect: "internal",
      },
    },
    {
      stepId: "deduplicate_data",
      title: "Deduplicate company and contact data",
      dependsOn: ["normalize_data"],
      executor: {
        kind: "service",
        serviceId: "deduplication",
        effect: "internal",
      },
    },
    {
      stepId: "verify_email",
      title: "Verify the contact email",
      dependsOn: ["deduplicate_data"],
      executor: {
        kind: "service",
        serviceId: "email_verification",
        effect: "internal",
      },
    },
    {
      stepId: "qualify_lead",
      title: "Qualify the lead",
      dependsOn: ["verify_email"],
      executor: {
        kind: "agent",
        agentId: "qualification-agent",
        capabilityId: "lead_qualification",
      },
    },
    {
      stepId: "personalize_message",
      title: "Prepare a personalized message",
      dependsOn: ["qualify_lead"],
      executor: {
        kind: "agent",
        agentId: "personalization-agent",
        capabilityId: "message_personalization",
      },
    },
    {
      stepId: "review_message_quality",
      title: "Review message quality",
      dependsOn: ["personalize_message"],
      executor: {
        kind: "agent",
        agentId: "message-quality-agent",
        capabilityId: "message_quality_review",
      },
    },
    {
      stepId: "review_message_compliance",
      title: "Review message compliance",
      dependsOn: ["personalize_message"],
      executor: {
        kind: "agent",
        agentId: "compliance-agent",
        capabilityId: "compliance_review",
      },
    },
    {
      stepId: "approve_message",
      title: "Obtain human message approval",
      dependsOn: [
        "verify_email",
        "review_message_quality",
        "review_message_compliance",
      ],
      executor: {
        kind: "human_gate",
        gateId: "message_approval",
      },
    },
    {
      stepId: "send_message",
      title: "Send the approved message",
      dependsOn: [
        "verify_email",
        "review_message_quality",
        "review_message_compliance",
        "approve_message",
      ],
      executor: {
        kind: "service",
        serviceId: "outreach_send",
        effect: "external",
      },
    },
  ],
} as const satisfies LeadWorkflowDefinition;

export const inboundReplyWorkflowDefinition = {
  workflowType: "inbound_reply",
  version: "1.0.0",
  steps: [
    {
      stepId: "ingest_reply",
      title: "Persist the inbound reply",
      dependsOn: [],
      executor: {
        kind: "service",
        serviceId: "reply_ingestion",
        effect: "internal",
      },
    },
    {
      stepId: "stop_sequence",
      title: "Stop pending follow-ups",
      dependsOn: ["ingest_reply"],
      executor: {
        kind: "service",
        serviceId: "sequence_stop",
        effect: "internal",
      },
    },
    {
      stepId: "classify_reply",
      title: "Classify the inbound reply",
      dependsOn: ["ingest_reply"],
      executor: {
        kind: "agent",
        agentId: "reply-agent",
        capabilityId: "reply_classification",
      },
    },
    {
      stepId: "draft_reply",
      title: "Prepare a reply draft",
      dependsOn: ["classify_reply"],
      executor: {
        kind: "agent",
        agentId: "reply-agent",
        capabilityId: "reply_drafting",
      },
    },
    {
      stepId: "approve_reply",
      title: "Obtain human reply approval",
      dependsOn: ["draft_reply", "stop_sequence"],
      executor: {
        kind: "human_gate",
        gateId: "reply_approval",
      },
    },
  ],
} as const satisfies LeadWorkflowDefinition;

const requiredSendDependencies = [
  "verify_email",
  "review_message_quality",
  "review_message_compliance",
  "approve_message",
] as const;

function assertDependenciesExist(
  definition: LeadWorkflowDefinition,
  stepIds: ReadonlySet<string>,
): void {
  for (const step of definition.steps) {
    for (const dependencyId of step.dependsOn) {
      if (!stepIds.has(dependencyId)) {
        throw new WorkflowDefinitionError(
          "missing_dependency",
          `Step ${step.stepId} depends on missing step ${dependencyId}.`,
        );
      }
    }
  }
}

function assertNoDependencyCycle(definition: LeadWorkflowDefinition): void {
  const stepsById = new Map(
    definition.steps.map((step) => [step.stepId, step] as const),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (stepId: string): void => {
    if (visited.has(stepId)) return;
    if (visiting.has(stepId)) {
      throw new WorkflowDefinitionError(
        "dependency_cycle",
        `Workflow dependency cycle detected at ${stepId}.`,
      );
    }

    visiting.add(stepId);
    const step = stepsById.get(stepId);
    for (const dependencyId of step?.dependsOn ?? []) {
      visit(dependencyId);
    }
    visiting.delete(stepId);
    visited.add(stepId);
  };

  for (const step of definition.steps) visit(step.stepId);
}

function assertExternalEffectsAreGated(
  definition: LeadWorkflowDefinition,
): void {
  const externalSteps = definition.steps.filter(
    (step) =>
      step.executor.kind === "service" && step.executor.effect === "external",
  );

  if (definition.workflowType === "inbound_reply" && externalSteps.length > 0) {
    throw new WorkflowDefinitionError(
      "external_effect_not_gated",
      "The inbound reply workflow must not send a reply automatically.",
    );
  }

  if (definition.workflowType !== "lead_outreach") return;
  const sendStep = externalSteps.find(
    (step) =>
      step.executor.kind === "service" &&
      step.executor.serviceId === "outreach_send",
  );
  if (!sendStep) {
    throw new WorkflowDefinitionError(
      "missing_required_step",
      "The lead outreach workflow requires a deterministic send step.",
    );
  }

  for (const dependencyId of requiredSendDependencies) {
    if (!sendStep.dependsOn.includes(dependencyId)) {
      throw new WorkflowDefinitionError(
        "external_effect_not_gated",
        `The send step requires ${dependencyId} before execution.`,
      );
    }
  }
}

export function assertValidLeadWorkflowDefinition(
  definition: LeadWorkflowDefinition,
): void {
  const stepIds = new Set<string>();
  for (const step of definition.steps) {
    if (stepIds.has(step.stepId)) {
      throw new WorkflowDefinitionError(
        "duplicate_step",
        `Duplicate workflow step ${step.stepId}.`,
      );
    }
    stepIds.add(step.stepId);
  }

  assertDependenciesExist(definition, stepIds);
  assertNoDependencyCycle(definition);
  assertExternalEffectsAreGated(definition);
}

export function getLeadWorkflowDefinition(
  workflowType: LeadWorkflowType,
): LeadWorkflowDefinition {
  const definition =
    workflowType === "lead_outreach"
      ? leadOutreachWorkflowDefinition
      : inboundReplyWorkflowDefinition;
  assertValidLeadWorkflowDefinition(definition);
  return definition;
}
