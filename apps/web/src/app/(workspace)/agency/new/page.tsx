import { Building2 } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/ui";
import { AgencyCreateForm } from "@/features/agency/components/agency-create-form";

export const metadata: Metadata = { title: "Créer une agence" };

export default function NewAgencyPage() {
  return (
    <div className="workspace-page agency-page">
      <PageHeader
        description="Créez le workspace principal avant d’ajouter vos clients et vos Recruiters."
        eyebrow="Première configuration"
        title="Créer mon agence"
      />
      <div className="agency-onboarding-note">
        <Building2 aria-hidden size={18} />
        <p>
          Le créateur devient Agency Owner. Les Recruiters seront invités
          ensuite et affectés uniquement aux clients autorisés.
        </p>
      </div>
      <AgencyCreateForm />
    </div>
  );
}
