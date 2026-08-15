import "@/app/operations.css";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  ModuleSurface,
  OperationsEmpty,
  RecordCard,
} from "@/features/operations/components/operations-ui";
import { ensureDefaultPipelineAction } from "@/features/operations/operations.actions";
import { getPipelineData } from "@/features/operations/operations.queries";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const result = await getPipelineData();
  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="CRM INTERNE"
        title="Pipeline"
        description="Un pipeline configurable avec valeur, probabilité, prochaine action et historique auditable."
      />
      {!result.ok ? (
        <ErrorState
          title="Pipeline indisponible"
          description={result.message}
        />
      ) : result.data.stages.length === 0 ? (
        <ModuleSurface
          title="Initialiser le pipeline"
          description="Créez les étapes MVP recommandées pour ce client."
        >
          <div className="ops-empty">
            <OperationsEmpty
              title="Aucune étape configurée"
              description="L’initialisation est explicite et n’ajoute aucune opportunité fictive."
            />
            <form
              action={ensureDefaultPipelineAction}
              className="ops-domain-form"
            >
              <button type="submit">Créer les étapes du pipeline</button>
            </form>
          </div>
        </ModuleSurface>
      ) : (
        <ModuleSurface
          count={result.data.opportunities.length}
          title="Vue Kanban"
          description="Les colonnes reflètent la configuration réelle du client actif."
        >
          <div className="ops-kanban" aria-label="Pipeline commercial">
            {result.data.stages.map((stage) => {
              const opportunities = result.data.opportunities.filter(
                (item) => item.stage_id === stage.id,
              );
              return (
                <section className="ops-kanban__column" key={stage.id}>
                  <header>
                    <span>{stage.name}</span>
                    <span>{opportunities.length}</span>
                  </header>
                  {opportunities.map((opportunity) => (
                    <RecordCard
                      key={opportunity.id}
                      title={opportunity.title}
                      description={
                        opportunity.value_amount === null
                          ? "Valeur non renseignée"
                          : `${Number(opportunity.value_amount).toLocaleString("fr-FR")} ${opportunity.currency}`
                      }
                      status={opportunity.status}
                      meta={`${opportunity.probability} % · ${opportunity.next_action ?? "prochaine action à définir"}`}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        </ModuleSurface>
      )}
    </main>
  );
}
