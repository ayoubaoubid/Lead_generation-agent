import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return <WorkspaceSectionPage sectionKey="integrations" />;
}
