import { z } from "zod";

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9:._-]+$/i);

export const planLeadWorkflowCommandSchema = z.discriminatedUnion(
  "workflowType",
  [
    z
      .object({
        workflowType: z.literal("lead_outreach"),
        contactId: z.uuid(),
        idempotencyKey: idempotencyKeySchema,
      })
      .strict(),
    z
      .object({
        workflowType: z.literal("inbound_reply"),
        replyId: z.uuid(),
        idempotencyKey: idempotencyKeySchema,
      })
      .strict(),
  ],
);

export type PlanLeadWorkflowCommand = z.infer<
  typeof planLeadWorkflowCommandSchema
>;

export const leadWorkflowTaskPayloadSchema = z
  .object({
    workflowRunId: z.uuid(),
  })
  .strict();

export type LeadWorkflowTaskPayload = z.infer<
  typeof leadWorkflowTaskPayloadSchema
>;
