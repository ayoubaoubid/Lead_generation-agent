import { FileClock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { CsvImportWizard } from "@/features/imports/components/csv-import-wizard";
import { getImportsPageData } from "@/features/lead-data/lead-data.queries";

export const metadata: Metadata = { title: "Imports" };

function statusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "failed" || status === "completed_with_errors")
    return "danger" as const;
  if (status === "processing" || status === "queued") return "brand" as const;
  if (status.includes("cancel")) return "warning" as const;
  return "neutral" as const;
}

export default async function ImportsPage() {
  const result = await getImportsPageData();
  if (!result.ok) {
    return (
      <section className="workspace-page lead-data-page">
        <PageHeader title="Imports" />
        <ErrorState
          description={result.message}
          title="Imports indisponibles"
        />
      </section>
    );
  }

  return (
    <section className="workspace-page lead-data-page">
      <PageHeader
        description="Import CSV contrôlé avec prévisualisation locale, traitement durable et rapport par ligne."
        eyebrow="Aucune fusion automatique"
        title="Imports"
      />
      <CsvImportWizard canWrite={result.data.canWrite} />
      <Card className="lead-data-list-card">
        <div className="lead-data-card-heading">
          <span className="ui-icon-tile">
            <FileClock aria-hidden size={17} />
          </span>
          <div>
            <h2>Historique</h2>
            <p>Les compteurs proviennent exclusivement des lignes traitées.</p>
          </div>
        </div>
        {result.data.imports.length ? (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <caption className="sr-only">Historique des imports CSV</caption>
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Créées</th>
                  <th>Doublons</th>
                  <th>Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {result.data.imports.map((dataImport) => (
                  <tr key={dataImport.id}>
                    <td>
                      <Link href={`/imports/${dataImport.id}`}>
                        <strong>{dataImport.fileName}</strong>
                      </Link>
                      <small>
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(dataImport.createdAt))}
                      </small>
                    </td>
                    <td>{dataImport.entityType}</td>
                    <td>
                      <Badge tone={statusTone(dataImport.status)}>
                        {dataImport.status}
                      </Badge>
                    </td>
                    <td>{dataImport.createdRowCount}</td>
                    <td>{dataImport.duplicateRowCount}</td>
                    <td>
                      {dataImport.invalidRowCount + dataImport.failedRowCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description="Le premier import apparaîtra ici après son téléversement sécurisé."
            icon={<FileClock aria-hidden size={20} />}
            title="Aucun historique"
          />
        )}
      </Card>
    </section>
  );
}
