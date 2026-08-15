import type { Metadata } from "next";

import "@/app/campaigns.css";

import { ErrorState, PageHeader } from "@/components/ui";
import { CampaignWorkspace } from "@/features/campaigns/components/campaign-workspace";
import { MessageReviewWorkspace } from "@/features/campaigns/components/message-review-workspace";
import { getCampaignPageData } from "@/features/campaigns/campaign.queries";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const result = await getCampaignPageData();
  return (
    <main className="workspace-page campaign-page">
      <PageHeader
        eyebrow="OUTREACH OPERATIONS"
        title="Campagnes"
        description="Concevez, révisez et planifiez des campagnes traçables sans contourner la validation humaine."
      />
      {!result.ok ? (
        <ErrorState
          title="Campagnes indisponibles"
          description={result.message}
        />
      ) : (
        <>
          <CampaignWorkspace
            campaigns={result.data.campaigns}
            timezone={result.data.timezone}
            canCreate={result.data.permissions.includes("campaign.create")}
            canWrite={result.data.permissions.includes("campaign.write")}
            canApprove={result.data.permissions.includes("campaign.approve")}
            canLaunch={result.data.permissions.includes("campaign.launch")}
          />
          <MessageReviewWorkspace
            variants={result.data.messageVariants}
            canWrite={result.data.permissions.includes("message.write")}
            canApprove={result.data.permissions.includes("message.approve")}
          />
        </>
      )}
    </main>
  );
}
