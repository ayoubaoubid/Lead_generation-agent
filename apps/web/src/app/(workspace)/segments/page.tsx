import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Segments" };

export default function SegmentsPage() {
  return <WorkspaceSectionPage sectionKey="segments" />;
}
