import "@/app/operations.css";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  ModuleSurface,
  OperationsEmpty,
  ReadinessNotice,
  RecordCard,
  RecordGrid,
} from "@/features/operations/components/operations-ui";
import { getComplianceData } from "@/features/operations/operations.queries";

export const metadata = { title: "Compliance" };

export default async function CompliancePage() {
  const result = await getComplianceData();
  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="GOUVERNANCE DES DONNÉES"
        title="Compliance"
        description="Traçabilité des sources, finalités, conservation, oppositions et suppressions par tenant."
      />
      {!result.ok ? (
        <ErrorState
          title="Conformité indisponible"
          description={result.message}
        />
      ) : (
        <div className="ops-layout">
          <ModuleSurface
            title="Configuration juridique"
            description="Cette configuration opérationnelle ne remplace pas un avis juridique qualifié."
          >
            <ReadinessNotice
              ready={result.data.profile?.configuration_status === "validated"}
              text={
                result.data.profile?.configuration_status === "validated"
                  ? "Configuration marquée comme validée pour les pays et canaux déclarés."
                  : "Une validation juridique reste requise avant le lancement réel."
              }
            />
            {result.data.profile ? (
              <RecordGrid>
                <RecordCard
                  title={result.data.profile.purpose}
                  description={`${result.data.profile.audience_type.toUpperCase()} · ${result.data.profile.countries.join(", ") || "pays à définir"}`}
                  status={result.data.profile.configuration_status}
                  meta={`${result.data.profile.retention_days ?? "—"} jours de conservation`}
                />
              </RecordGrid>
            ) : null}
          </ModuleSurface>

          <ModuleSurface
            count={result.data.suppressions?.length ?? 0}
            title="Suppression list"
            description="Les adresses sont masquées et bloquées au niveau client ou agence."
          >
            {result.data.suppressions?.length ? (
              <RecordGrid>
                {result.data.suppressions.map((entry) => (
                  <RecordCard
                    key={entry.id}
                    title={entry.masked_email}
                    description={`Portée ${entry.scope}`}
                    status={entry.reason}
                    meta={new Date(entry.effective_at).toLocaleString("fr-FR")}
                  />
                ))}
              </RecordGrid>
            ) : (
              <OperationsEmpty
                kind="shield"
                title="Aucune suppression enregistrée"
                description="Les désabonnements, plaintes et suppressions apparaîtront ici sans conserver l’adresse complète."
              />
            )}
          </ModuleSurface>

          <ModuleSurface
            count={result.data.requests?.length ?? 0}
            title="Demandes relatives aux données"
            description="Accès, export et suppression avec échéance et preuve de traitement."
          >
            {result.data.requests?.length ? (
              <RecordGrid>
                {result.data.requests.map((request) => (
                  <RecordCard
                    key={request.id}
                    title={request.request_type.replaceAll("_", " ")}
                    status={request.status}
                    meta={
                      request.due_at
                        ? `Échéance ${new Date(request.due_at).toLocaleDateString("fr-FR")}`
                        : "Échéance à définir"
                    }
                  />
                ))}
              </RecordGrid>
            ) : (
              <OperationsEmpty
                kind="shield"
                title="Aucune demande ouverte"
                description="Les demandes vérifiées seront suivies ici jusqu’à leur résolution."
              />
            )}
          </ModuleSurface>
        </div>
      )}
    </main>
  );
}
