import { Building2, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
} from "@/components/ui";
import { CompanyArchiveButton } from "@/features/companies/components/company-archive-button";
import { CompanyCreateForm } from "@/features/companies/components/company-create-form";
import { getCompaniesPageData } from "@/features/lead-data/lead-data.queries";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q : "";
  const result = await getCompaniesPageData(search);
  if (!result.ok) {
    return (
      <section className="workspace-page lead-data-page">
        <PageHeader title="Companies" />
        <ErrorState
          description={result.message}
          title="Entreprises indisponibles"
        />
      </section>
    );
  }

  return (
    <section className="workspace-page lead-data-page">
      <PageHeader
        actions={
          <Link
            className="ui-button ui-button--secondary ui-button--md"
            href="/imports"
          >
            Importer un CSV
          </Link>
        }
        description="Référentiel client-scoped avec provenance, confiance et état de vérification."
        eyebrow="Données vérifiables"
        title="Companies"
      />
      <CompanyCreateForm canWrite={result.data.canWrite} />
      <Card className="lead-data-list-card">
        <form className="lead-data-search" method="get">
          <Search aria-hidden size={16} />
          <Input
            aria-label="Rechercher une entreprise"
            defaultValue={search}
            name="q"
            placeholder="Rechercher par nom…"
          />
        </form>
        {result.data.companies.length ? (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <caption className="sr-only">Entreprises du client actif</caption>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Source du fait</th>
                  <th>Confiance</th>
                  <th>Vérification</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.data.companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <strong>{company.name}</strong>
                      <small>{company.domain ?? company.industry ?? "—"}</small>
                    </td>
                    <td>
                      <Badge
                        tone={
                          company.factStatus === "confirmed"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {company.factStatus}
                      </Badge>
                    </td>
                    <td>
                      {company.confidenceScore === null
                        ? "Non renseignée"
                        : `${company.confidenceScore}%`}
                    </td>
                    <td>{company.verificationStatus}</td>
                    <td>
                      {result.data.canWrite ? (
                        <CompanyArchiveButton companyId={company.id} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description="Ajoutez une entreprise manuellement ou importez un CSV après avoir sélectionné un client."
            icon={<Building2 aria-hidden size={20} />}
            title="Aucune entreprise"
          />
        )}
      </Card>
    </section>
  );
}
