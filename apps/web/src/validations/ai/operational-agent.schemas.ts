import { z } from "zod";

import {
  groundedStatementSchema,
  groundingSummarySchema,
} from "@/validations/ai/commercial-skill.schemas";

const shortText = z.string().trim().min(1).max(500);
const longText = z.string().trim().min(1).max(5_000);
const confidence = z.number().min(0).max(1);

export const leadResearchAgentOutputSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            externalReference: z.string().trim().min(1).max(200),
            displayName: shortText,
            relevanceReasons: z.array(groundedStatementSchema).max(20),
            confidence,
          })
          .strict(),
      )
      .max(100),
    grounding: groundingSummarySchema,
  })
  .strict();

export const leadQualificationAgentOutputSchema = z
  .object({
    recommendation: z.enum([
      "high_priority",
      "medium_priority",
      "low_priority",
      "needs_data",
      "exclude",
    ]),
    confidence,
    reasons: z.array(groundedStatementSchema).max(30),
    missingCriteria: z.array(shortText).max(30),
    scoringModelVersion: z.string().trim().min(1).max(100),
  })
  .strict();

export const messagePersonalizationAgentOutputSchema = z
  .object({
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(2_000),
    callToAction: shortText,
    usedStatements: z.array(groundedStatementSchema).max(20),
    missingEvidence: z.array(shortText).max(20),
  })
  .strict();

export const messageReviewAgentOutputSchema = z
  .object({
    recommendation: z.enum(["accept", "revise", "reject"]),
    confidence,
    issues: z
      .array(
        z
          .object({
            code: z.string().trim().min(1).max(100),
            severity: z.enum(["info", "warning", "blocking"]),
            explanation: longText,
            statementReferenceIds: z
              .array(z.string().trim().min(1).max(120))
              .max(20),
          })
          .strict(),
      )
      .max(50),
    requiresHumanApproval: z.literal(true),
  })
  .strict();

export const replyClassificationAgentOutputSchema = z
  .object({
    category: z.enum([
      "positive_interest",
      "information_request",
      "meeting_requested",
      "interested_later",
      "wrong_contact",
      "redirected",
      "not_interested",
      "objection",
      "unsubscribe",
      "out_of_office",
      "automatic_reply",
      "existing_customer",
      "competitor",
      "spam",
      "ambiguous",
    ]),
    confidence,
    extractedIntent: longText,
    proposedDraft: z.string().trim().min(1).max(5_000).nullable(),
    requiresHumanReview: z.literal(true),
    grounding: groundingSummarySchema,
  })
  .strict();

export type LeadResearchAgentOutput = z.infer<
  typeof leadResearchAgentOutputSchema
>;
export type LeadQualificationAgentOutput = z.infer<
  typeof leadQualificationAgentOutputSchema
>;
export type MessagePersonalizationAgentOutput = z.infer<
  typeof messagePersonalizationAgentOutputSchema
>;
export type MessageReviewAgentOutput = z.infer<
  typeof messageReviewAgentOutputSchema
>;
export type ReplyClassificationAgentOutput = z.infer<
  typeof replyClassificationAgentOutputSchema
>;
