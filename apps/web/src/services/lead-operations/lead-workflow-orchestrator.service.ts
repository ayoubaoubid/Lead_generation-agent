import type { LeadWorkflowDefinition } from "@/domain/lead-operations/lead-workflow";
import { getLeadWorkflowDefinition } from "@/domain/lead-operations/lead-workflow";
import { DomainError } from "@/domain/errors/domain-error";
import type {
  WorkflowRunRepository,
  WorkflowTarget,
} from "@/repositories/contracts/workflow-run.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import {
  agentCanUseCapability,
  aiAgentRegistry,
} from "@/services/ai/agent-registry";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";
import type {
  LeadWorkflowTaskPayload,
  PlanLeadWorkflowCommand,
} from "@/validations/lead-operations/lead-workflow.schema";

export interface LeadWorkflowAuthorizer {
  assertCanPlanWorkflow(
    input: Readonly<{
      workflowType: PlanLeadWorkflowCommand["workflowType"];
      resourceId: string;
    }>,
    context: ServiceContext & { tenant: ClientTenantContext },
  ): Promise<void>;
}

type LeadWorkflowOrchestratorDependencies = Readonly<{
  authorizer: LeadWorkflowAuthorizer;
  repository: WorkflowRunRepository;
}>;

export type PlanLeadWorkflowResult = Readonly<{
  workflowRunId: string;
  created: boolean;
  workflowType: PlanLeadWorkflowCommand["workflowType"];
  workflowVersion: string;
  triggerPayload: LeadWorkflowTaskPayload;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "tenant_mismatch",
      "Lead workflows require an active client workspace.",
    );
  }
}

function repositoryContext(context: ServiceContext): RepositoryContext {
  return {
    tenant: context.tenant,
    correlationId: context.correlationId,
  };
}

function targetFromCommand(command: PlanLeadWorkflowCommand): WorkflowTarget {
  return command.workflowType === "lead_outreach"
    ? { resourceType: "contact", resourceId: command.contactId }
    : { resourceType: "reply", resourceId: command.replyId };
}

function assertAgentCapabilities(definition: LeadWorkflowDefinition): void {
  for (const step of definition.steps) {
    if (step.executor.kind !== "agent") continue;
    if (!aiAgentRegistry[step.executor.agentId]) {
      throw new DomainError(
        "invalid_state",
        `Workflow agent ${step.executor.agentId} is not registered.`,
      );
    }
    if (
      !agentCanUseCapability(step.executor.agentId, step.executor.capabilityId)
    ) {
      throw new DomainError(
        "invalid_state",
        `Workflow agent ${step.executor.agentId} cannot use ${step.executor.capabilityId}.`,
      );
    }
  }
}

export class LeadWorkflowOrchestratorService {
  constructor(
    private readonly dependencies: LeadWorkflowOrchestratorDependencies,
  ) {}

  async planWorkflow(
    command: PlanLeadWorkflowCommand,
    context: ServiceContext,
  ): Promise<PlanLeadWorkflowResult> {
    assertClientScope(context);
    const target = targetFromCommand(command);

    await this.dependencies.authorizer.assertCanPlanWorkflow(
      {
        workflowType: command.workflowType,
        resourceId: target.resourceId,
      },
      context,
    );

    const persistenceContext = repositoryContext(context);
    const targetTenant = await this.dependencies.repository.findTargetTenant(
      target,
      persistenceContext,
    );
    if (!targetTenant) {
      throw new DomainError(
        "resource_not_found",
        "The workflow resource could not be found.",
      );
    }
    if (
      targetTenant.agencyId !== context.tenant.agencyId ||
      targetTenant.clientId !== context.tenant.clientId
    ) {
      throw new DomainError(
        "tenant_mismatch",
        "The workflow resource does not belong to the active client workspace.",
      );
    }

    const definition = getLeadWorkflowDefinition(command.workflowType);
    assertAgentCapabilities(definition);
    const reservation = await this.dependencies.repository.reserveWorkflowRun(
      {
        target,
        definition,
        idempotencyKey: command.idempotencyKey,
      },
      persistenceContext,
    );

    context.logger.info("Lead workflow run reserved.", {
      operation: "lead_workflow.plan",
      correlationId: context.correlationId,
      agencyId: context.tenant.agencyId,
      clientId: context.tenant.clientId,
      actor: context.tenant.actor,
      resourceType: target.resourceType,
      resourceId: target.resourceId,
      attributes: {
        workflowType: command.workflowType,
        workflowVersion: definition.version,
        created: reservation.created,
      },
    });

    return {
      workflowRunId: reservation.workflowRunId,
      created: reservation.created,
      workflowType: command.workflowType,
      workflowVersion: definition.version,
      triggerPayload: {
        workflowRunId: reservation.workflowRunId,
      },
    };
  }
}
