import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return <WorkspaceSectionPage sectionKey="inbox" />;
}
