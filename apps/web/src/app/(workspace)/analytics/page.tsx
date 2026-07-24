import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <WorkspaceSectionPage sectionKey="analytics" />;
}
