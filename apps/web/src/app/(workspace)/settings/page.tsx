import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <WorkspaceSectionPage sectionKey="settings" />;
}
