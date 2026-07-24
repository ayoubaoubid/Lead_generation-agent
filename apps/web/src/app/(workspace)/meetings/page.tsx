import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Meetings" };

export default function MeetingsPage() {
  return <WorkspaceSectionPage sectionKey="meetings" />;
}
