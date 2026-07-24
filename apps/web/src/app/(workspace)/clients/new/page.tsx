import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ErrorState, PageHeader } from "@/components/ui";
import { ClientProfileForm } from "@/features/clients/components/client-profile-form";
import { getSafeCreateClientPageData } from "@/features/clients/client.queries";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function NewClientPage() {
  const result = await getSafeCreateClientPageData();

  if (!result.ok || !result.data.canCreate) {
    return (
      <div className="workspace-page client-page">
        <PageHeader title="Nouveau client" />
        <ErrorState
          description={
            result.ok
              ? "Votre rôle ne permet pas de créer un espace client."
              : result.message
          }
          title="Permission requise"
        />
      </div>
    );
  }

  return (
    <div className="workspace-page client-page">
      <PageHeader
        breadcrumbs={
          <Link className="client-back-link" href="/clients">
            <ChevronLeft aria-hidden size={13} />
            Clients
          </Link>
        }
        description="Créez un espace isolé. Les accès membres et les campagnes seront configurés séparément."
        eyebrow="Configuration"
        title="Nouveau client"
      />
      <ClientProfileForm mode="create" />
    </div>
  );
}
