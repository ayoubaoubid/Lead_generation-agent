import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  ClientDirectory,
  ClientFilters,
} from "@/features/clients/components/client-directory";
import { getClientListPageData } from "@/features/clients/client.queries";

export const metadata: Metadata = { title: "Clients" };

type ClientsPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const result = await getClientListPageData(await searchParams);
  if (!result.ok) {
    return (
      <div className="workspace-page client-page">
        <PageHeader
          description="Sélectionnez une agence autorisée pour accéder à son portefeuille."
          eyebrow="Portefeuille agence"
          title="Clients"
        />
        <ErrorState description={result.message} title="Accès indisponible" />
      </div>
    );
  }

  const { data } = result;
  const canCreate = data.permissions.includes("client.create");

  return (
    <div className="workspace-page client-page">
      <PageHeader
        actions={
          canCreate ? (
            <Link
              className="ui-button ui-button--primary ui-button--md"
              href="/clients/new"
            >
              <Plus aria-hidden size={16} />
              Nouveau client
            </Link>
          ) : null
        }
        description="Pilotez les espaces, équipes et informations de chaque compte sans mélanger les tenants."
        eyebrow="Portefeuille agence"
        title="Clients"
      />
      <ClientFilters query={data.query} />
      <ClientDirectory page={data.clients} query={data.query} />
    </div>
  );
}
