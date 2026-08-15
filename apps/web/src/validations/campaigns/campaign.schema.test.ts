import { describe, expect, it } from "vitest";

import {
  campaignTransitionSchema,
  createCampaignDraftSchema,
} from "@/validations/campaigns/campaign.schema";

describe("campaign schemas", () => {
  it("normalizes optional strategy references in a campaign draft", () => {
    const result = createCampaignDraftSchema.parse({
      name: "Founders France",
      objective: "Obtenir des conversations qualifiées",
      channel: "email",
      timezone: "Europe/Paris",
      offerId: "",
      icpId: null,
      segmentId: "",
      personaIds: [],
      sequenceName: "Séquence principale",
      templateSubject: "Question rapide",
      templateBody: "Bonjour {{firstName}}",
    });

    expect(result.offerId).toBeNull();
    expect(result.icpId).toBeNull();
    expect(result.segmentId).toBeNull();
  });

  it("requires an explicit offset-aware instant when scheduling", () => {
    const result = campaignTransitionSchema.safeParse({
      campaignId: "00000000-0000-4000-8000-000000000001",
      action: "schedule",
      scheduledStartAt: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an offset-aware scheduled instant", () => {
    const result = campaignTransitionSchema.safeParse({
      campaignId: "00000000-0000-4000-8000-000000000001",
      action: "schedule",
      scheduledStartAt: "2026-08-15T09:00:00+01:00",
    });

    expect(result.success).toBe(true);
  });
});
