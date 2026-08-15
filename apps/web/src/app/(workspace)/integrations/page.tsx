import { ErrorState, PageHeader } from "@/components/ui";
import "@/app/operations.css";
import {
  ModuleSurface,
  OperationsEmpty,
  ReadinessNotice,
  RecordCard,
  RecordGrid,
} from "@/features/operations/components/operations-ui";
import { createSendingDomainAction } from "@/features/operations/operations.actions";
import { getIntegrationsData } from "@/features/operations/operations.queries";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const result = await getIntegrationsData();
  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="INFRASTRUCTURE DE CONTACT"
        title="Intégrations"
        description="Connectez les domaines, comptes d’envoi et calendriers. Les secrets restent hors des tables applicatives."
      />
      {!result.ok ? (
        <ErrorState
          title="Intégrations indisponibles"
          description={result.message}
        />
      ) : (
        <div className="ops-layout">
          <ModuleSurface
            count={result.data.domains.length}
            title="Domaines d’envoi"
            description="Inventaire tenant-scoped et état DNS vérifié."
          >
            {result.data.domains.length ? (
              <RecordGrid>
                {result.data.domains.map((domain) => (
                  <RecordCard
                    key={domain.id}
                    title={domain.domain}
                    status={domain.status}
                    meta={
                      domain.last_checked_at
                        ? `Vérifié le ${new Date(domain.last_checked_at).toLocaleDateString("fr-FR")}`
                        : "Contrôle DNS en attente"
                    }
                  />
                ))}
              </RecordGrid>
            ) : (
              <OperationsEmpty
                title="Aucun domaine d’envoi"
                description="Ajoutez d’abord un domaine que votre agence contrôle."
              />
            )}
            <form
              action={createSendingDomainAction}
              className="ops-domain-form"
            >
              <label className="sr-only" htmlFor="sending-domain">
                Domaine d’envoi
              </label>
              <input
                id="sending-domain"
                name="domain"
                placeholder="mail.votre-client.fr"
                required
                type="text"
              />
              <button type="submit">Ajouter le domaine</button>
            </form>
          </ModuleSurface>

          <ModuleSurface
            count={result.data.accounts.length}
            title="Comptes d’envoi"
            description="Quotas, réputation et fenêtres d’envoi par compte."
          >
            {result.data.accounts.length ? (
              <RecordGrid>
                {result.data.accounts.map((account) => (
                  <RecordCard
                    key={account.id}
                    title={account.email_address}
                    description={`${account.provider} · ${account.timezone}`}
                    status={account.status}
                    meta={`${account.sent_today}/${account.daily_limit} envoyés aujourd’hui · rebond ${(Number(account.bounce_rate) * 100).toFixed(1)} %`}
                  />
                ))}
              </RecordGrid>
            ) : (
              <OperationsEmpty
                title="Aucun compte connecté"
                description="La connexion OAuth ou API sera finalisée côté serveur après la validation du domaine."
              />
            )}
          </ModuleSurface>

          <ModuleSurface
            count={result.data.checks.length}
            title="Checklist de délivrabilité"
            description="SPF, DKIM, DMARC, quotas et qualité de liste doivent être validés avant lancement."
          >
            <ReadinessNotice
              ready={
                result.data.checks.length >= 8 &&
                result.data.checks.every((check) => check.status === "passed")
              }
              text={
                result.data.checks.length
                  ? "Les contrôles critiques sont recalculés avant chaque envoi."
                  : "La campagne restera bloquée tant que les contrôles critiques ne sont pas disponibles."
              }
            />
            {result.data.checks.length ? (
              <RecordGrid>
                {result.data.checks.map((check) => (
                  <RecordCard
                    key={check.id}
                    title={check.kind.replaceAll("_", " ").toUpperCase()}
                    status={check.status}
                    meta={
                      check.is_critical
                        ? "Contrôle critique"
                        : "Contrôle informatif"
                    }
                  />
                ))}
              </RecordGrid>
            ) : null}
          </ModuleSurface>

          <ModuleSurface
            count={result.data.calendars.length}
            title="Calendriers"
            description="Connexions abstraites, disponibilité et synchronisation."
          >
            {result.data.calendars.length ? (
              <RecordGrid>
                {result.data.calendars.map((calendar) => (
                  <RecordCard
                    key={calendar.id}
                    title={calendar.provider}
                    description={calendar.timezone}
                    status={calendar.status}
                    meta={
                      calendar.last_sync_at
                        ? `Synchronisé le ${new Date(calendar.last_sync_at).toLocaleString("fr-FR")}`
                        : "Première synchronisation en attente"
                    }
                  />
                ))}
              </RecordGrid>
            ) : (
              <OperationsEmpty
                kind="calendar"
                title="Aucun calendrier connecté"
                description="Les rendez-vous peuvent être préparés, mais aucun créneau externe ne sera réservé."
              />
            )}
          </ModuleSurface>
        </div>
      )}
    </main>
  );
}
