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
} as const satisfies Record<
  CommercialSkillId,
  Readonly<{ input: z.ZodType; output: z.ZodType }>
>;

export function getCommercialSkillSchemas(skillId: CommercialSkillId) {
  return commercialSkillSchemas[skillId];
}
