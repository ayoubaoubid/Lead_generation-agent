import type { Metadata } from "next";

import { WorkspaceSectionPage } from "@/features/workspace/components/workspace-section-page";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return <WorkspaceSectionPage sectionKey="companies" />;
}
