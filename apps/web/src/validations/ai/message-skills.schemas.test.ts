import { describe, expect, it } from "vitest";

import { commercialSkillSchemas } from "@/validations/ai/commercial-skill.schemas";

const sourceReference = {
  referenceId: "prospect-site-1",
  label: "Prospect website",
  url: "https://example.test",
};

const confirmedStatement = {
  statement: "The company serves independent retailers.",
  classification: "confirmed_fact" as const,
  confidence: 1,
  sourceReferenceIds: ["prospect-site-1"],
};

const grounding = {
  statements: [confirmedStatement],
  missingEvidence: [],
};

describe("message skill schemas", () => {
  it("rejects unsourced or hypothetical facts from personalization inputs", () => {
    const result = commercialSkillSchemas[
      "cold-email-personalization"
    ].input.safeParse({
      objective: "Prepare one grounded cold email.",
      knownStatements: [],
      evidenceReferences: [sourceReference],
      constraints: [],
      validatedPositioning: true,
      validatedOffer: true,
      language: "fr",
      tone: "direct",
      mainIdea: "Discuss the observed retail workflow.",
      callToAction: "Open to a short conversation?",
      prospectStatements: [
        {
          ...confirmedStatement,
          classification: "hypothesis",
          sourceReferenceIds: [],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a declared word count that differs from the generated body", () => {
    const body = Array.from({ length: 50 }, () => "mot").join(" ");
    const result = commercialSkillSchemas[
      "cold-email-personalization"
    ].output.safeParse({
      subject: "Question rapide",
      body,
      mainIdea: "Comprendre la priorité.",
      callToAction: "Ouvert à un échange ?",
      wordCount: 51,
      usedStatements: [confirmedStatement],
      missingEvidence: [],
      grounding,
    });

    expect(result.success).toBe(false);
  });

  it("requires human approval after every compliance recommendation", () => {
    const result = commercialSkillSchemas[
      "message-compliance-review"
    ].output.safeParse({
      decision: "approve",
      blockingReasons: [],
      warnings: [],
      missingRequirements: [],
      policyVersion: "policy-v1",
      requiresHumanApproval: false,
      grounding,
    });

    expect(result.success).toBe(false);
  });
});
