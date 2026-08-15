import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { getImportDetailData } from "@/features/lead-data/lead-data.queries";
import { ImportCancelButton } from "@/features/imports/components/import-cancel-button";
import { ImportQueueButton } from "@/features/imports/components/import-queue-button";

export const metadata: Metadata = { title: "Rapport d’import" };

export default async function ImportDetailPage({
  params,
}: Readonly<{ params: Promise<{ importId: string }> }>) {
  const { importId } = await params;
  const result = await getImportDetailData(importId);
  if (!result.ok) {
    return (
      <section className="workspace-page lead-data-page">
        <PageHeader title="Rapport d’import" />
        <ErrorState description={result.message} title="Rapport indisponible" />
      </section>
    );
  }
  const { dataImport, rows, canWrite } = result.data;
  const cancellable = [
    "draft",
    "ready",
    "queued",
    "processing",
    "cancel_requested",
  ].includes(dataImport.status);

  return (
    <section className="workspace-page lead-data-page">
      <Link className="lead-data-back-link" href="/imports">
        <ArrowLeft aria-hidden size={15} />
        Retour aux imports
      </Link>
      <PageHeader
        actions={
          canWrite && cancellable ? (
            <div className="lead-data-page-actions">
              {dataImport.status === "ready" ? (
                <ImportQueueButton importId={dataImport.id} />
              ) : null}
              <ImportCancelButton importId={dataImport.id} />
            </div>
          ) : undefined
        }
        description={`${dataImport.processedRowCount} ligne(s) traitée(s) sur ${dataImport.estimatedRowCount ?? "un total non déterminé"}.`}
        eyebrow={dataImport.entityType}
        title={dataImport.fileName}
      />
      <div className="import-report-grid">
        {[
          ["Créées", dataImport.createdRowCount],
          ["Doublons ignorés", dataImport.duplicateRowCount],
          ["Invalides", dataImport.invalidRowCount],
          ["Échecs techniques", dataImport.failedRowCount],
        ].map(([label, value]) => (
          <Card className="import-report-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
      <Card className="lead-data-list-card">
        <div className="lead-data-card-heading">
          <span className="ui-icon-tile">
            <AlertTriangle aria-hidden size={17} />
          </span>
          <div>
            <h2>Rapport par ligne</h2>
            <p>Le contenu personnel brut n’est pas affiché dans ce rapport.</p>
          </div>
        </div>
        {rows.length ? (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <caption className="sr-only">
                Résultats des lignes importées
              </caption>
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Statut</th>
                  <th>Déduplication</th>
                  <th>Erreur</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.rowNumber}</td>
                    <td>
                      <Badge
                        tone={
                          row.status === "created"
                            ? "success"
                            : row.status === "invalid" ||
                                row.status === "failed"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td>{row.duplicateReason ?? "—"}</td>
                    <td>{row.errorMessage ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description="Les résultats apparaîtront au démarrage du worker Trigger.dev."
            icon={<AlertTriangle aria-hidden size={20} />}
            title="Aucune ligne traitée"
          />
        )}
      </Card>
      <p className="import-cancellation-note">
        Une annulation empêche le traitement des lots suivants. Les lignes déjà
        validées restent enregistrées afin d’éviter une suppression destructive
        ou l’écrasement de modifications ultérieures.
      </p>
    </section>
  );
}
