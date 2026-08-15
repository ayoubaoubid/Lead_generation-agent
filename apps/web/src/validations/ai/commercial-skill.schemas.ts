import { z } from "zod";

import {
  commercialSkillIds,
  type CommercialSkillId,
} from "@/domain/ai/commercial-skill";
import { evidenceClassifications } from "@/domain/ai/ai-execution";

const shortText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(5000);
const shortTextList = z.array(shortText).max(50);
const confidence = z.number().min(0).max(1);

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export const evidenceReferenceSchema = z.object({
  referenceId: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(240),
  url: z.url().max(2048).nullable(),
});

export const groundedStatementSchema = z.object({
  statement: longText,
  classification: z.enum(evidenceClassifications),
  confidence,
  sourceReferenceIds: z.array(z.string().trim().min(1).max(120)).max(20),
});

export const groundingSummarySchema = z.object({
  statements: z.array(groundedStatementSchema).max(100),
  missingEvidence: shortTextList,
});

const baseInputSchema = z.object({
  objective: longText,
  knownStatements: z.array(groundedStatementSchema).max(100),
  evidenceReferences: z.array(evidenceReferenceSchema).max(100),
  constraints: shortTextList,
});

const baseOutputShape = {
  grounding: groundingSummarySchema,
} as const;

const experimentSchema = z.object({
  hypothesis: longText,
  minimumAction: longText,
  primaryMetric: shortText,
  safetyMetric: shortText.nullable(),
  sampleSize: z.number().int().positive().nullable(),
  durationDays: z.number().int().positive().max(365).nullable(),
  successCriterion: longText,
  possibleDecision: z.enum(["continue", "iterate", "pivot", "stop"]),
  requiredInstrumentation: shortTextList,
});

const usableMessageStatementSchema = groundedStatementSchema.superRefine(
  (statement, context) => {
    if (
      !["confirmed_fact", "extracted_fact"].includes(
        statement.classification,
      ) ||
      statement.sourceReferenceIds.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Message generation accepts only confirmed or extracted sourced facts.",
      });
    }
  },
);

const coldEmailPersonalizationOutputSchema = z
  .object({
    subject: z.string().trim().min(1).max(160),
    body: longText,
    mainIdea: longText,
    callToAction: shortText,
    wordCount: z.number().int().min(50).max(120),
    usedStatements: z.array(usableMessageStatementSchema).max(20),
    missingEvidence: shortTextList,
    ...baseOutputShape,
  })
  .superRefine((output, context) => {
    if (countWords(output.body) !== output.wordCount) {
      context.addIssue({
        code: "custom",
        path: ["wordCount"],
        message: "The declared word count must match the generated body.",
      });
    }
  });

const messageComplianceReviewOutputSchema = z.object({
  decision: z.enum(["approve", "revise", "reject"]),
  blockingReasons: shortTextList,
  warnings: shortTextList,
  missingRequirements: shortTextList,
  policyVersion: shortText,
  requiresHumanApproval: z.literal(true),
  ...baseOutputShape,
});

const replyCategories = [
  "positive_interest",
  "information_request",
  "meeting_requested",
  "later",
  "wrong_contact",
  "referral",
  "not_interested",
  "objection",
  "unsubscribe",
  "out_of_office",
  "automatic_reply",
  "existing_customer",
  "competitor",
  "spam",
  "ambiguous",
] as const;

export const commercialSkillSchemas = {
  diagnose: {
    input: baseInputSchema.extend({
      observedMetrics: z.record(z.string(), z.number().finite()).default({}),
      observedIncidents: shortTextList,
      currentStage: shortText.nullable(),
    }),
    output: z.object({
      diagnosis: longText,
      probableCauses: z.array(
        z.object({
          cause: longText,
          category: z.enum([
            "targeting",
            "offer",
            "message",
            "channel",
            "pricing",
            "deliverability",
            "data_quality",
            "integration",
            "workflow",
            "qualification",
            "personalization",
          ]),
          confidence,
        }),
      ),
      confidence,
      recommendedSkill: z.enum(commercialSkillIds).nullable(),
      recommendedActions: shortTextList,
      requiredEvidence: shortTextList,
      ...baseOutputShape,
    }),
  },
  "mom-test": {
    input: baseInputSchema.extend({
      personas: shortTextList,
      researchGoals: shortTextList,
      interviewContext: longText.nullable(),
    }),
    output: z.object({
      interviewGuide: shortTextList,
      questionsByPersona: z.array(
        z.object({ persona: shortText, questions: shortTextList }),
      ),
      noteTakingGrid: shortTextList,
      painSignals: shortTextList,
      budgetSignals: shortTextList,
      urgencySignals: shortTextList,
      suggestedIcpCriteria: shortTextList,
      suggestedScoringCriteria: shortTextList,
      ...baseOutputShape,
    }),
  },
  "four-steps": {
    input: baseInputSchema.extend({
      declaredStage: shortText.nullable(),
      availableProofs: shortTextList,
      unvalidatedHypotheses: shortTextList,
    }),
    output: z.object({
      currentStage: shortText,
      unvalidatedHypotheses: shortTextList,
      availableProofs: shortTextList,
      nextTest: longText,
      validationCriterion: longText,
      prematureScalingRisk: longText,
      ...baseOutputShape,
    }),
  },
  "lean-startup": {
    input: baseInputSchema.extend({
      hypothesis: longText,
      availableResources: shortTextList,
      safetyConstraints: shortTextList,
    }),
    output: z.object({
      experiment: experimentSchema,
      ...baseOutputShape,
    }),
  },
  "obviously-awesome": {
    input: baseInputSchema.extend({
      competitiveAlternatives: shortTextList,
      demonstratedCapabilities: shortTextList,
      candidateSegments: shortTextList,
    }),
    output: z.object({
      competitiveAlternatives: shortTextList,
      uniqueCapabilities: shortTextList,
      customerValue: shortTextList,
      bestFitSegments: shortTextList,
      marketCategory: shortText,
      proofPoints: shortTextList,
      positioningStatement: longText,
      excludedSegments: shortTextList,
      ...baseOutputShape,
    }),
  },
  "100m-offers": {
    input: baseInputSchema.extend({
      desiredOutcome: longText,
      currentOffer: longText,
      availableProofs: shortTextList,
      authorizedGuarantees: shortTextList,
    }),
    output: z.object({
      confirmedPromise: longText.nullable(),
      conditionalPromises: shortTextList,
      availableProofs: shortTextList,
      missingProofs: shortTextList,
      hypotheses: shortTextList,
      authorizedGuarantees: shortTextList,
      prohibitedGuarantees: shortTextList,
      offerComponents: shortTextList,
      ...baseOutputShape,
    }),
  },
  "100m-leads": {
    input: baseInputSchema.extend({
      targetSegments: shortTextList,
      availableChannels: shortTextList,
      technicalBudget: z.number().nonnegative().nullable(),
      testDurationDays: z.number().int().positive().max(365),
    }),
    output: z.object({
      primaryChannel: shortText,
      secondaryChannel: shortText.nullable(),
      segment: shortText,
      leadSources: shortTextList,
      initialVolume: z.number().int().positive(),
      cadence: longText,
      technicalBudget: z.number().nonnegative().nullable(),
      testDurationDays: z.number().int().positive().max(365),
      leadMagnet: longText.nullable(),
      objective: longText,
      metrics: shortTextList,
      stopRules: shortTextList,
      ...baseOutputShape,
    }),
  },
  "spin-selling": {
    input: baseInputSchema.extend({
      prospectSummary: longText,
      emailHistory: shortTextList,
      crmFacts: shortTextList,
      offerSummary: longText,
      previousObjections: shortTextList,
      pipelineStage: shortText,
    }),
    output: z.object({
      prospectSummary: longText,
      knownInformation: shortTextList,
      missingInformation: shortTextList,
      situationQuestions: shortTextList,
      problemQuestions: shortTextList,
      implicationQuestions: shortTextList,
      needPayoffQuestions: shortTextList,
      probableObjections: shortTextList,
      proofsToPresent: shortTextList,
      meetingObjective: longText,
      desiredNextStep: longText,
      ...baseOutputShape,
    }),
  },
  storybrand: {
    input: baseInputSchema.extend({
      format: z.enum([
        "cold_email",
        "landing_page",
        "proposal",
        "sales_page",
        "presentation",
      ]),
      audience: longText,
      offerSummary: longText,
      verifiedObservation: longText.nullable(),
      callToAction: shortText,
    }),
    output: z.object({
      hero: longText,
      problem: longText,
      guide: longText,
      plan: shortTextList,
      callToAction: shortText,
      draft: longText,
      wordCount: z.number().int().nonnegative(),
      ...baseOutputShape,
    }),
  },
  "made-to-stick": {
    input: baseInputSchema.extend({
      content: longText,
      format: shortText,
      intendedAudience: longText,
    }),
    output: z.object({
      decision: z.enum(["approve", "revise", "reject"]),
      scores: z.object({
        clarity: z.number().min(0).max(10),
        concreteness: z.number().min(0).max(10),
        credibility: z.number().min(0).max(10),
        relevance: z.number().min(0).max(10),
        length: z.number().min(0).max(10),
        originality: z.number().min(0).max(10),
        exaggerationRisk: z.number().min(0).max(10),
        callToActionQuality: z.number().min(0).max(10),
      }),
      detectedIssues: shortTextList,
      revisionInstructions: shortTextList,
      ...baseOutputShape,
    }),
  },
  "cold-email-personalization": {
    input: baseInputSchema.extend({
      validatedPositioning: z.literal(true),
      validatedOffer: z.literal(true),
      language: z.string().trim().min(2).max(20),
      tone: shortText,
      mainIdea: longText,
      callToAction: shortText,
      prospectStatements: z.array(usableMessageStatementSchema).max(30),
    }),
    output: coldEmailPersonalizationOutputSchema,
  },
  "message-compliance-review": {
    input: baseInputSchema.extend({
      content: longText,
      recipientCountry: z.string().trim().length(2).nullable(),
      senderIdentity: longText.nullable(),
      suppressionStatus: z.enum([
        "eligible",
        "unsubscribed",
        "suppressed",
        "hard_bounced",
        "complained",
      ]),
      processingJustificationDocumented: z.boolean(),
      policyVersion: shortText,
    }),
    output: messageComplianceReviewOutputSchema,
  },
  "reply-classification": {
    input: baseInputSchema.extend({
      subject: z.string().trim().max(1000).nullable(),
      body: z.string().trim().min(1).max(100_000),
      campaignContext: longText,
      language: z.string().trim().min(2).max(20),
      allowedCategories: z.array(z.enum(replyCategories)).min(1),
    }),
    output: z.object({
      category: z.enum(replyCategories),
      confidence,
      evidence: shortTextList,
      explanation: longText,
      requiresHumanReview: z.boolean(),
      recommendedTask: z.enum([
        "review_reply",
        "respond",
        "schedule_meeting",
        "research",
        "manual_review",
      ]),
      missingContext: shortTextList,
      ...baseOutputShape,
    }),
  },
  "objection-handling": {
    input: baseInputSchema.extend({
      objection: longText,
      objectionType: shortText,
      validatedOffer: longText,
      validatedPositioning: longText,
      confirmedProofs: shortTextList,
      authorizedGuarantees: shortTextList,
      language: z.string().trim().min(2).max(20),
      maxWords: z.number().int().min(20).max(500),
    }),
    output: z.object({
      objectionType: shortText,
      acknowledgement: longText,
      responseDraft: longText,
      groundedClaims: z.array(usableMessageStatementSchema).max(20),
      questions: shortTextList,
      missingEvidence: shortTextList,
      recommendedNextStep: longText,
      confidence,
      requiresHumanReview: z.literal(true),
      ...baseOutputShape,
    }),
  },
} as const satisfies Record<
  CommercialSkillId,
  Readonly<{ input: z.ZodType; output: z.ZodType }>
>;

export function getCommercialSkillSchemas(skillId: CommercialSkillId) {
  return commercialSkillSchemas[skillId];
}
