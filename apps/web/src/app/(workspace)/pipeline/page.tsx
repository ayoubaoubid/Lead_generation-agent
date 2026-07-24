import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return <WorkspaceSectionPage sectionKey="pipeline" />;
}
