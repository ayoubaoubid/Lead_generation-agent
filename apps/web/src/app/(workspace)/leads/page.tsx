import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return <WorkspaceSectionPage sectionKey="leads" />;
}
