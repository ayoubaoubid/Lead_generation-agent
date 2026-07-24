import { describe, expect, it } from "vitest";

import {
  groundedStatementSchema,
  groundingSummarySchema,
} from "@/validations/ai/commercial-skill.schemas";

describe("commercial skill schemas", () => {
  it("requires every statement to distinguish facts from hypotheses", () => {
    expect(
      groundedStatementSchema.safeParse({
        statement: "Le prospect a consulté la page.",
        confidence: 1,
        sourceReferenceIds: ["event-1"],
      }).success,
    ).toBe(false);

    expect(
      groundedStatementSchema.safeParse({
        statement: "Le prospect a consulté la page.",
        classification: "extracted_fact",
        confidence: 1,
        sourceReferenceIds: ["event-1"],
      }).success,
    ).toBe(true);
  });

  it("rejects confidence outside the normalized range", () => {
    expect(
      groundingSummarySchema.safeParse({
        statements: [
          {
            statement: "Une hypothèse non confirmée.",
            classification: "hypothesis",
            confidence: 1.2,
            sourceReferenceIds: [],
          },
        ],
        missingEvidence: [],
      }).success,
    ).toBe(false);
  });
});
