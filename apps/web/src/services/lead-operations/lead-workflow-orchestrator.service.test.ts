import { describe, expect, it, vi } from "vitest";

import type { Logger } from "@/lib/logging/logger";
import type {
  WorkflowRunRepository,
  WorkflowTarget,
} from "@/repositories/contracts/workflow-run.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import type { ServiceContext } from "@/services/service-context";

import {
  LeadWorkflowOrchestratorService,
  type LeadWorkflowAuthorizer,
} from "./lead-workflow-orchestrator.service";

const agencyId = "a0000000-0000-4000-8000-000000000001";
const otherAgencyId = "a0000000-0000-4000-8000-000000000002";
const clientId = "c0000000-0000-4000-8000-000000000001";
const actorId = "10000000-0000-4000-8000-000000000001";
const contactId = "20000000-0000-4000-8000-000000000001";
const workflowRunId = "30000000-0000-4000-8000-000000000001";

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const clientContext: ServiceContext = {
  tenant: {
    scope: "client",
    agencyId,
    clientId,
    actor: { kind: "user", actorId },
  },
  correlationId: "workflow-test",
  logger,
};

const agencyContext: ServiceContext = {
  tenant: {
    scope: "agency",
    agencyId,
    actor: { kind: "user", actorId },
  },
  correlationId: "workflow-test",
  logger,
};

class AuthorizerFake implements LeadWorkflowAuthorizer {
  readonly assertSpy = vi.fn(
    async (
      _input: Parameters<LeadWorkflowAuthorizer["assertCanPlanWorkflow"]>[0],
      _context: Parameters<LeadWorkflowAuthorizer["assertCanPlanWorkflow"]>[1],
    ) => {
      void _input;
      void _context;
    },
  );

  async assertCanPlanWorkflow(
    input: Parameters<LeadWorkflowAuthorizer["assertCanPlanWorkflow"]>[0],
    context: Parameters<LeadWorkflowAuthorizer["assertCanPlanWorkflow"]>[1],
  ): Promise<void> {
    return this.assertSpy(input, context);
  }
}

class WorkflowRunRepositoryFake implements WorkflowRunRepository {
  targetTenant = { agencyId, clientId };
  readonly findSpy = vi.fn(
    async (target: WorkflowTarget, context: RepositoryContext) => {
      void target;
      void context;
      return this.targetTenant;
    },
  );
  readonly reserveSpy = vi.fn(
    async (
      input: Parameters<WorkflowRunRepository["reserveWorkflowRun"]>[0],
      context: RepositoryContext,
    ) => {
      void input;
      void context;
      return { workflowRunId, created: true };
    },
  );

  async findTargetTenant(target: WorkflowTarget, context: RepositoryContext) {
    return this.findSpy(target, context);
  }

  async reserveWorkflowRun(
    input: Parameters<WorkflowRunRepository["reserveWorkflowRun"]>[0],
    context: RepositoryContext,
  ) {
    return this.reserveSpy(input, context);
  }
}

describe("LeadWorkflowOrchestratorService", () => {
  it("derives the target tenant server-side and emits an opaque task payload", async () => {
    const repository = new WorkflowRunRepositoryFake();
    const authorizer = new AuthorizerFake();
    const service = new LeadWorkflowOrchestratorService({
      repository,
      authorizer,
    });

    const result = await service.planWorkflow(
      {
        workflowType: "lead_outreach",
        contactId,
        idempotencyKey: "lead:test:contact-1",
      },
      clientContext,
    );

    expect(result.triggerPayload).toEqual({ workflowRunId });
    expect(result.triggerPayload).not.toHaveProperty("agencyId");
    expect(result.triggerPayload).not.toHaveProperty("clientId");
    expect(repository.findSpy).toHaveBeenCalledWith(
      { resourceType: "contact", resourceId: contactId },
      expect.objectContaining({
        tenant: expect.objectContaining({ agencyId, clientId }),
      }),
    );
    expect(repository.reserveSpy).toHaveBeenCalledOnce();
  });

  it("refuses an agency-only context", async () => {
    const repository = new WorkflowRunRepositoryFake();
    const service = new LeadWorkflowOrchestratorService({
      repository,
      authorizer: new AuthorizerFake(),
    });

    await expect(
      service.planWorkflow(
        {
          workflowType: "lead_outreach",
          contactId,
          idempotencyKey: "lead:test:contact-1",
        },
        agencyContext,
      ),
    ).rejects.toMatchObject({ code: "tenant_mismatch" });
    expect(repository.findSpy).not.toHaveBeenCalled();
  });

  it("rejects a target reloaded from another tenant", async () => {
    const repository = new WorkflowRunRepositoryFake();
    repository.targetTenant = { agencyId: otherAgencyId, clientId };
    const service = new LeadWorkflowOrchestratorService({
      repository,
      authorizer: new AuthorizerFake(),
    });

    await expect(
      service.planWorkflow(
        {
          workflowType: "lead_outreach",
          contactId,
          idempotencyKey: "lead:test:contact-1",
        },
        clientContext,
      ),
    ).rejects.toMatchObject({ code: "tenant_mismatch" });
    expect(repository.reserveSpy).not.toHaveBeenCalled();
  });
});
