import type { LeadWorkflowDefinition } from "@/domain/lead-operations/lead-workflow";
import type { RepositoryContext } from "@/repositories/repository-context";

export type WorkflowTarget = Readonly<{
  resourceType: "contact" | "reply";
  resourceId: string;
}>;

export type WorkflowTargetTenant = Readonly<{
  agencyId: string;
  clientId: string;
}>;

export type WorkflowRunReservation = Readonly<{
  workflowRunId: string;
  created: boolean;
}>;

export interface WorkflowRunRepository {
  findTargetTenant(
    target: WorkflowTarget,
    context: RepositoryContext,
  ): Promise<WorkflowTargetTenant | null>;

  reserveWorkflowRun(
    input: Readonly<{
      target: WorkflowTarget;
      definition: LeadWorkflowDefinition;
      idempotencyKey: string;
    }>,
    context: RepositoryContext,
  ): Promise<WorkflowRunReservation>;
}
