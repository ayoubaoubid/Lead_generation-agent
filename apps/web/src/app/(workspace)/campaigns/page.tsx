import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Campaigns" };

export default function CampaignsPage() {
  return <WorkspaceSectionPage sectionKey="campaigns" />;
}
