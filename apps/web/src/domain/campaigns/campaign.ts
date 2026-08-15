export const campaignStatuses = [
  "draft",
  "ready_for_review",
  "approved",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

export const outreachChannels = ["email", "linkedin", "multichannel"] as const;
export type OutreachChannel = (typeof outreachChannels)[number];

export type CampaignSummary = Readonly<{
  id: string;
  name: string;
  objective: string;
  status: CampaignStatus;
  channel: OutreachChannel;
  timezone: string;
  offerId: string | null;
  icpId: string | null;
  segmentId: string | null;
  scheduledStartAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;
