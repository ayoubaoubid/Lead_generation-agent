import "@/app/operations.css";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  MetricStrip,
  ModuleSurface,
  OperationsEmpty,
  RecordCard,
  RecordGrid,
} from "@/features/operations/components/operations-ui";
import { getOperationalCenterData } from "@/features/operations/operations.queries";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const result = await getOperationalCenterData();
  if (!result.ok) {
    return (
      <main className="workspace-page ops-page">
        <PageHeader title="Dashboard" eyebrow="OPERATIONS" />
        <ErrorState
          title="Centre opérationnel indisponible"
          description={result.message}
        />
      </main>
    );
  }

  const attentionCount =
    result.data.failedTasks.length +
    result.data.disconnectedAccounts.length +
    result.data.disconnectedCalendars.length +
    result.data.pausedCampaigns.length +
    result.data.highBounceAccounts.length +
    result.data.quotaAccounts.length +
    result.data.providerFailures.length +
    result.data.pendingReviews.length;

  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="OPERATIONS"
        title="Centre de contrôle"
        description="Incidents, quotas, campagnes en pause et validations humaines du client actif."
      />
      <MetricStrip
        metrics={[
          {
            label: "Actions requises",
            value: attentionCount.toLocaleString("fr-FR"),
            detail: "Toutes catégories",
          },
          {
            label: "Tâches échouées",
            value: result.data.failedTasks.length.toLocaleString("fr-FR"),
            detail: "Trigger.dev",
          },
          {
            label: "Validations",
            value: result.data.pendingReviews.length.toLocaleString("fr-FR"),
            detail: "Messages en attente",
          },
          {
            label: "Campagnes en pause",
            value: result.data.pausedCampaigns.length.toLocaleString("fr-FR"),
            detail: "Arrêt contrôlé",
          },
        ]}
      />
      <div className="ops-layout">
        <ModuleSurface
          count={result.data.failedTasks.length}
          title="Exécutions échouées"
          description="Erreurs redacted, corrélées au run et au tenant."
        >
          {result.data.failedTasks.length ? (
            <RecordGrid>
              {result.data.failedTasks.map((task) => (
                <RecordCard
                  key={task.id}
                  title={task.task_id}
                  status="failed"
                  meta={`${task.error_code ?? "erreur non classée"} · ${new Date(task.updated_at).toLocaleString("fr-FR")}`}
                />
              ))}
            </RecordGrid>
          ) : (
            <OperationsEmpty
              title="Aucune tâche en échec"
              description="Le registre durable ne contient aucun échec pour ce client."
            />
          )}
        </ModuleSurface>

        <ModuleSurface
          count={
            result.data.disconnectedAccounts.length +
            result.data.disconnectedCalendars.length
          }
          title="Intégrations à reconnecter"
          description="Comptes d’envoi et calendriers indisponibles."
        >
          <RecordGrid>
            {result.data.disconnectedAccounts.map((account) => (
              <RecordCard
                key={account.id}
                title={account.email_address}
                status={account.status}
                meta={
                  account.last_connection_error_code ?? "Connexion à vérifier"
                }
              />
            ))}
            {result.data.disconnectedCalendars.map((calendar) => (
              <RecordCard
                key={calendar.id}
                title={calendar.provider}
                status={calendar.status}
                meta={calendar.last_error_code ?? "Synchronisation à vérifier"}
              />
            ))}
          </RecordGrid>
        </ModuleSurface>
      </div>
    </main>
  );
}
