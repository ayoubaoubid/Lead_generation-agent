import { z } from "zod";

import { outreachChannels } from "@/domain/campaigns/campaign";

const optionalUuid = z
  .union([z.uuid(), z.literal(""), z.null()])
  .transform((value) => (value ? value : null));

export const createCampaignDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    objective: z.string().trim().min(1).max(2_000),
    channel: z.enum(outreachChannels),
    timezone: z.string().trim().min(1).max(100),
    offerId: optionalUuid,
    icpId: optionalUuid,
    segmentId: optionalUuid,
    personaIds: z.array(z.uuid()).max(20),
    sequenceName: z.string().trim().min(1).max(160),
    templateSubject: z.string().trim().max(200),
    templateBody: z.string().trim().min(1).max(10_000),
  })
  .strict();

export const campaignTransitionSchema = z
  .object({
    campaignId: z.uuid(),
    action: z.enum(["submit", "approve", "schedule", "pause", "cancel"]),
    scheduledStartAt: z
      .union([z.iso.datetime({ offset: true }), z.literal(""), z.null()])
      .transform((value) => (value ? value : null)),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action === "schedule" && !value.scheduledStartAt) {
      context.addIssue({
        code: "custom",
        path: ["scheduledStartAt"],
        message: "A scheduled campaign requires an explicit start instant.",
      });
    }
  });

export type CreateCampaignDraftInput = z.infer<
  typeof createCampaignDraftSchema
>;
export type CampaignTransitionInput = z.infer<typeof campaignTransitionSchema>;
