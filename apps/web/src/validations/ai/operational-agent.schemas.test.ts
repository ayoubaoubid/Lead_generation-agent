import { describe, expect, it } from "vitest";

import {
  leadQualificationAgentOutputSchema,
  messageReviewAgentOutputSchema,
  replyClassificationAgentOutputSchema,
} from "@/validations/ai/operational-agent.schemas";

const grounding = {
  statements: [
    {
      statement: "The reply asks to stop further communication.",
      classification: "confirmed_fact" as const,
      confidence: 1,
      sourceReferenceIds: ["reply-1"],
    },
  ],
  missingEvidence: [],
};

describe("operational agent output schemas", () => {
  it("requires grounded qualification reasons", () => {
    const parsed = leadQualificationAgentOutputSchema.safeParse({
      recommendation: "high_priority",
      confidence: 0.9,
      reasons: [
        {
          statement: "The company matches the validated employee range.",
          classification: "confirmed_fact",
          confidence: 0.95,
          sourceReferenceIds: ["company-1"],
        },
      ],
      missingCriteria: [],
      scoringModelVersion: "icp-v1",
    });

    expect(parsed.success).toBe(true);
  });

  it("never accepts a message review that bypasses human approval", () => {
    const parsed = messageReviewAgentOutputSchema.safeParse({
      recommendation: "accept",
      confidence: 0.8,
      issues: [],
      requiresHumanApproval: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("keeps inbound reply classification under human review", () => {
    const parsed = replyClassificationAgentOutputSchema.safeParse({
      category: "unsubscribe",
      confidence: 0.99,
      extractedIntent: "The recipient asks to be removed.",
      proposedDraft: null,
      requiresHumanReview: true,
      grounding,
    });

    expect(parsed.success).toBe(true);
  });
});
