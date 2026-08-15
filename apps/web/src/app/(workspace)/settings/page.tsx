import type { Metadata } from "next";

import { ErrorState, PageHeader } from "@/components/ui";
import { RecruiterManagementPanel } from "@/features/agency/components/recruiter-management-panel";
import { getAgencyManagementPageData } from "@/features/agency/agency.queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const result = await getAgencyManagementPageData();

  if (!result.ok) {
    return (
      <div className="workspace-page agency-page">
        <PageHeader title="Paramètres" />
        <ErrorState description={result.message} title="Agence requise" />
      </div>
    );
  }

  return (
    <div className="workspace-page agency-page">
      <PageHeader
        description="Invitations et accès clients. Les permissions sont toujours vérifiées côté serveur."
        eyebrow={result.data.agency.name}
        title="Équipe de l’agence"
      />
      <RecruiterManagementPanel data={result.data} />
    </div>
  );
}
