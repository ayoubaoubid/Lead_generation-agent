import { describe, expect, it, vi } from "vitest";

import type { AiExecutionResult } from "@/domain/ai/ai-execution";
import type { Logger } from "@/lib/logging/logger";
import { CampaignMessageGenerationService } from "@/services/messages/campaign-message-generation.service";
import type { ServiceContext } from "@/services/service-context";

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const context: ServiceContext = {
  tenant: {
    scope: "client",
    agencyId: "agency-a",
    clientId: "client-a",
    actor: { kind: "user", actorId: "user-a" },
  },
  correlationId: "correlation-a",
  logger,
};

const statement = {
  statement: "The company serves independent retailers.",
  classification: "confirmed_fact" as const,
  confidence: 1,
  sourceReferenceIds: ["site-1"],
};

const grounding = {
  statements: [statement],
  missingEvidence: [],
};

const validInput = {
  validatedPositioning: true as const,
  validatedOffer: true as const,
  objective: "Start a qualified conversation.",
  intendedAudience: "Operations leaders in retail software companies.",
  language: "fr",
  tone: "direct and respectful",
  mainIdea: "Discuss the observed retailer workflow.",
  callToAction: "Open to a short conversation?",
  knownStatements: [statement],
  evidenceReferences: [
    {
      referenceId: "site-1",
      label: "Prospect website",
      url: "https://example.test",
    },
  ],
  constraints: ["Do not invent results."],
  recipientCountry: "FR",
  senderIdentity: "A. Example, Example Agency",
  suppressionStatus: "eligible" as const,
  processingJustificationDocumented: true,
  compliancePolicyVersion: "policy-v1",
};

function result(
  skillId: string,
  output: unknown,
  sequence: number,
): AiExecutionResult {
  return {
    executionId: `execution-${sequence}`,
    status: "succeeded",
    agentId: "test-agent",
    agentVersion: "1.0.0",
    skillId,
    skillVersion: "1.0.0",
    promptVersion: "1",
    modelId: "test-model",
    modelProfile: "balanced",
    output,
    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    technicalCost: {
      amountMicrousd: 100,
      currency: "USD",
      pricingVersion: "test-v1",
    },
    attempts: 1,
    startedAt: "2026-07-26T10:00:00.000Z",
    completedAt: "2026-07-26T10:00:01.000Z",
  };
}

const body = Array.from({ length: 50 }, () => "mot").join(" ");

const personalizationOutput = {
  subject: "Question rapide",
  body,
  mainIdea: "Comprendre la priorité opérationnelle.",
  callToAction: "Ouvert à un échange ?",
  wordCount: 50,
  usedStatements: [statement],
  missingEvidence: [],
  grounding,
};

const qualityOutput = {
  decision: "approve" as const,
  scores: {
    clarity: 9,
    concreteness: 8,
    credibility: 9,
    relevance: 8,
    length: 10,
    originality: 7,
    exaggerationRisk: 1,
    callToActionQuality: 8,
  },
  detectedIssues: [],
  revisionInstructions: [],
  grounding,
};

const complianceOutput = {
  decision: "approve" as const,
  blockingReasons: [],
  warnings: [],
  missingRequirements: [],
  policyVersion: "policy-v1",
  requiresHumanApproval: true as const,
  grounding,
};

describe("CampaignMessageGenerationService", () => {
  it("stops at mandatory human review after both machine reviews approve", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(
        result("cold-email-personalization", personalizationOutput, 1),
      )
      .mockResolvedValueOnce(result("made-to-stick", qualityOutput, 2))
      .mockResolvedValueOnce(
        result("message-compliance-review", complianceOutput, 3),
      );
    const service = new CampaignMessageGenerationService({ execute });

    const generated = await service.generate(validInput, context);

    expect(generated.status).toBe("human_review_pending");
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it("does not run compliance when quality requests a revision", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(
        result("cold-email-personalization", personalizationOutput, 1),
      )
      .mockResolvedValueOnce(
        result(
          "made-to-stick",
          {
            ...qualityOutput,
            decision: "revise",
            detectedIssues: ["CTA is too broad."],
          },
          2,
        ),
      );
    const service = new CampaignMessageGenerationService({ execute });

    const generated = await service.generate(validInput, context);

    expect(generated).toMatchObject({
      status: "requires_revision",
      stage: "quality",
    });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("rejects ungrounded input before invoking a model", async () => {
    const execute = vi.fn();
    const service = new CampaignMessageGenerationService({ execute });

    await expect(
      service.generate(
        {
          ...validInput,
          knownStatements: [
            {
              ...statement,
              classification: "hypothesis" as const,
              sourceReferenceIds: [],
            },
          ],
        },
        context,
      ),
    ).rejects.toBeDefined();
    expect(execute).not.toHaveBeenCalled();
  });
});
