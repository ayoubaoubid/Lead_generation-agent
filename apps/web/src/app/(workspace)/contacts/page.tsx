import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <WorkspaceSectionPage sectionKey="contacts" />;
}
