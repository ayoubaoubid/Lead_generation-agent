import { describe, expect, it } from "vitest";

import {
  assertValidLeadWorkflowDefinition,
  inboundReplyWorkflowDefinition,
  leadOutreachWorkflowDefinition,
  type LeadWorkflowDefinition,
} from "@/domain/lead-operations/lead-workflow";

describe("lead workflow definitions", () => {
  it("keeps the outbound workflow valid and gates its external effect", () => {
    expect(() =>
      assertValidLeadWorkflowDefinition(leadOutreachWorkflowDefinition),
    ).not.toThrow();

    const sendStep = leadOutreachWorkflowDefinition.steps.find(
      (step) => step.stepId === "send_message",
    );

    expect(sendStep?.executor).toEqual({
      kind: "service",
      serviceId: "outreach_send",
      effect: "external",
    });
    expect(sendStep?.dependsOn).toEqual(
      expect.arrayContaining([
        "verify_email",
        "review_message_quality",
        "review_message_compliance",
        "approve_message",
      ]),
    );
  });

  it("keeps inbound replies in draft mode without automatic sending", () => {
    expect(() =>
      assertValidLeadWorkflowDefinition(inboundReplyWorkflowDefinition),
    ).not.toThrow();
    const inboundSteps: LeadWorkflowDefinition["steps"] =
      inboundReplyWorkflowDefinition.steps;

    expect(
      inboundSteps.some(
        (step) =>
          step.executor.kind === "service" &&
          step.executor.serviceId === "outreach_send",
      ),
    ).toBe(false);
    expect(
      inboundReplyWorkflowDefinition.steps.find(
        (step) => step.stepId === "approve_reply",
      )?.executor,
    ).toEqual({ kind: "human_gate", gateId: "reply_approval" });
  });

  it("rejects an outbound workflow that bypasses human approval", () => {
    const unsafeDefinition: LeadWorkflowDefinition = {
      ...leadOutreachWorkflowDefinition,
      steps: leadOutreachWorkflowDefinition.steps.map((step) =>
        step.stepId === "send_message"
          ? {
              ...step,
              dependsOn: step.dependsOn.filter(
                (dependencyId) => dependencyId !== "approve_message",
              ),
            }
          : step,
      ),
    };

    expect(() =>
      assertValidLeadWorkflowDefinition(unsafeDefinition),
    ).toThrowError(
      expect.objectContaining({ code: "external_effect_not_gated" }),
    );
  });

  it("rejects dependency cycles before a workflow can be scheduled", () => {
    const cyclicDefinition: LeadWorkflowDefinition = {
      ...inboundReplyWorkflowDefinition,
      steps: inboundReplyWorkflowDefinition.steps.map((step) =>
        step.stepId === "ingest_reply"
          ? { ...step, dependsOn: ["approve_reply"] }
          : step,
      ),
    };

    expect(() =>
      assertValidLeadWorkflowDefinition(cyclicDefinition),
    ).toThrowError(expect.objectContaining({ code: "dependency_cycle" }));
  });
});
