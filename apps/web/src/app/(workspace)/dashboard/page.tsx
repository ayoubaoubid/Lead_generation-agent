import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <WorkspaceSectionPage sectionKey="dashboard" />;
}
