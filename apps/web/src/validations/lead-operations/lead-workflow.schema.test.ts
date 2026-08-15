import { describe, expect, it } from "vitest";

import {
  leadWorkflowTaskPayloadSchema,
  planLeadWorkflowCommandSchema,
} from "@/validations/lead-operations/lead-workflow.schema";

const contactId = "20000000-0000-4000-8000-000000000001";
const workflowRunId = "30000000-0000-4000-8000-000000000001";

describe("lead workflow boundary schemas", () => {
  it("accepts a resource command without tenant identifiers", () => {
    expect(
      planLeadWorkflowCommandSchema.safeParse({
        workflowType: "lead_outreach",
        contactId,
        idempotencyKey: "lead:test:contact-1",
      }).success,
    ).toBe(true);
  });

  it("rejects browser-supplied tenant identifiers", () => {
    expect(
      planLeadWorkflowCommandSchema.safeParse({
        workflowType: "lead_outreach",
        contactId,
        agencyId: "a0000000-0000-4000-8000-000000000001",
        clientId: "c0000000-0000-4000-8000-000000000001",
        idempotencyKey: "lead:test:contact-1",
      }).success,
    ).toBe(false);
  });

  it("allows Trigger.dev to receive only an opaque workflow run identifier", () => {
    expect(
      leadWorkflowTaskPayloadSchema.safeParse({ workflowRunId }).success,
    ).toBe(true);
    expect(
      leadWorkflowTaskPayloadSchema.safeParse({
        workflowRunId,
        agencyId: "a0000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(false);
  });
});
