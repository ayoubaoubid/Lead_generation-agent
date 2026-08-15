import "@/app/operations.css";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  MetricStrip,
  ModuleSurface,
  ReadinessNotice,
} from "@/features/operations/components/operations-ui";
import { getAnalyticsData } from "@/features/operations/operations.queries";

export const metadata = { title: "Analytics" };

function numericMetric(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export default async function AnalyticsPage() {
  const result = await getAnalyticsData();
  if (!result.ok) {
    return (
      <main className="workspace-page ops-page">
        <PageHeader title="Analytics" eyebrow="PERFORMANCE" />
        <ErrorState
          title="Analytics indisponibles"
          description={result.message}
        />
      </main>
    );
  }

  const data = result.data;
  const metrics = [
    ["Leads", numericMetric(data.leads), "30 derniers jours"],
    ["Qualifiés", numericMetric(data.qualifiedLeads), "Scoring déterministe"],
    ["Emails envoyés", numericMetric(data.emailsSent), "Envois acceptés"],
    ["Réponses", numericMetric(data.replies), "Messages entrants"],
    [
      "Réponses positives",
      numericMetric(data.positiveReplies),
      "Classification validée",
    ],
    ["Rendez-vous", numericMetric(data.meetings), "Confirmés et suivis"],
    ["Opportunités", numericMetric(data.opportunities), "Pipeline interne"],
    ["Ventes", numericMetric(data.wonSales), "Opportunités gagnées"],
  ].map(([label, value, detail]) => ({
    label: String(label),
    value: Number(value).toLocaleString("fr-FR"),
    detail: String(detail),
  }));

  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="PERFORMANCE"
        title="Analytics"
        description="Métriques calculées uniquement à partir des événements réels du tenant actif."
      />
      <MetricStrip metrics={metrics} />
      <ModuleSurface
        title="Coûts et rentabilité"
        description="Les coûts représentent uniquement la consommation technique des fournisseurs."
      >
        <ReadinessNotice
          ready={false}
          text="La marge agence n’est pas calculée : contrats, paiements et coûts de prestation restent volontairement hors plateforme."
        />
      </ModuleSurface>
    </main>
  );
}
