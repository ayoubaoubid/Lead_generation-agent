import { z } from "zod";

import { evidenceClassifications } from "@/domain/ai/ai-execution";
import { messageFormats } from "@/domain/messages/campaign-message";

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export const messageGroundedStatementSchema = z
  .object({
    statement: z.string().trim().min(1).max(5_000),
    classification: z.enum(evidenceClassifications),
    confidence: z.number().min(0).max(1),
    sourceReferenceIds: z
      .array(z.string().trim().min(1).max(120))
      .min(1)
      .max(20),
  })
  .strict()
  .superRefine((statement, context) => {
    if (
      !["confirmed_fact", "extracted_fact"].includes(statement.classification)
    ) {
      context.addIssue({
        code: "custom",
        path: ["classification"],
        message: "Only confirmed or extracted facts can ground a message.",
      });
    }
  });

export const createCampaignMessageVariantSchema = z
  .object({
    messageId: z.uuid().nullable(),
    campaignId: z.uuid(),
    campaignProspectId: z.uuid(),
    sequenceStepId: z.uuid(),
    origin: z.enum(["ai_generated", "human_edit", "regenerated"]),
    format: z.enum(messageFormats),
    subject: z.string().trim().min(1).max(200).nullable(),
    body: z.string().trim().min(1).max(10_000),
    callToAction: z.string().trim().min(1).max(500),
    mainIdea: z.string().trim().min(1).max(1_000),
    groundedStatements: z.array(messageGroundedStatementSchema).max(20),
    missingEvidence: z.array(z.string().trim().min(1).max(500)).max(20),
    inputSnapshot: z.record(z.string(), z.unknown()),
    skillVersions: z.record(
      z.string().trim().min(1).max(100),
      z.string().trim().min(1).max(50),
    ),
    aiExecutionId: z.uuid().nullable(),
    generationCostMicrousd: z.number().int().nonnegative().nullable(),
    generationTokens: z.number().int().nonnegative().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    const wordCount = countWords(value.body);
    if (value.format === "cold_email" && (wordCount < 50 || wordCount > 120)) {
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: "Cold emails must contain between 50 and 120 words.",
      });
    }
  });

export const submitCampaignMessageSchema = z
  .object({ versionId: z.uuid() })
  .strict();

export const humanMessageReviewSchema = z
  .object({
    versionId: z.uuid(),
    decision: z.enum(["approve", "reject"]),
    issues: z.array(z.string().trim().min(1).max(500)).max(20),
  })
  .strict();

export const campaignMessageGenerationInputSchema = z
  .object({
    validatedPositioning: z.literal(true),
    validatedOffer: z.literal(true),
    objective: z.string().trim().min(1).max(5_000),
    intendedAudience: z.string().trim().min(1).max(5_000),
    language: z.string().trim().min(2).max(20),
    tone: z.string().trim().min(1).max(500),
    mainIdea: z.string().trim().min(1).max(5_000),
    callToAction: z.string().trim().min(1).max(500),
    knownStatements: z.array(messageGroundedStatementSchema).max(100),
    evidenceReferences: z
      .array(
        z
          .object({
            referenceId: z.string().trim().min(1).max(120),
            label: z.string().trim().min(1).max(240),
            url: z.url().max(2_048).nullable(),
          })
          .strict(),
      )
      .max(100),
    constraints: z.array(z.string().trim().min(1).max(500)).max(50),
    recipientCountry: z.string().trim().length(2).nullable(),
    senderIdentity: z.string().trim().min(1).max(5_000).nullable(),
    suppressionStatus: z.enum([
      "eligible",
      "unsubscribed",
      "suppressed",
      "hard_bounced",
      "complained",
    ]),
    processingJustificationDocumented: z.boolean(),
    compliancePolicyVersion: z.string().trim().min(1).max(100),
  })
  .strict();

export type CreateCampaignMessageVariantInput = z.infer<
  typeof createCampaignMessageVariantSchema
>;
export type SubmitCampaignMessageInput = z.infer<
  typeof submitCampaignMessageSchema
>;
export type HumanMessageReviewInput = z.infer<typeof humanMessageReviewSchema>;
export type CampaignMessageGenerationInput = z.infer<
  typeof campaignMessageGenerationInputSchema
>;
