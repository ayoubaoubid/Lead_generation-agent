import { ChevronLeft, Compass, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { StrategyCreateDraftForm } from "@/features/strategy/components/strategy-create-draft-form";
import { StrategyEvidencePanel } from "@/features/strategy/components/strategy-evidence-panel";
import { StrategyVersionEditor } from "@/features/strategy/components/strategy-version-editor";
import { StrategyVersionHistory } from "@/features/strategy/components/strategy-version-history";
import { positioningFields } from "@/features/strategy/strategy-field-config";
import { getStrategyPageData } from "@/features/strategy/strategy.queries";

export const metadata: Metadata = { title: "Positioning" };

type PositioningPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function PositioningPage({
  searchParams,
}: PositioningPageProps) {
  const result = await getStrategyPageData("positioning", await searchParams);

  if (!result.ok) {
    return (
      <section className="workspace-page strategy-artifact-page">
        <PageHeader title="Positioning" />
        <ErrorState
          description={result.message}
          title="Positionnement indisponible"
        />
      </section>
    );
  }

  const { canWrite, selectedArtifact, selectedVersion, workspace } =
    result.data;

  return (
    <section className="workspace-page strategy-artifact-page">
      <PageHeader
        actions={
          selectedArtifact &&
          !selectedArtifact.versions.some(
            (version) => version.status === "draft",
          ) ? (
            <StrategyCreateDraftForm
              artifactId={selectedArtifact.id}
              artifactType="positioning"
              canWrite={canWrite}
            />
          ) : undefined
        }
        breadcrumbs={
          <Link className="client-back-link" href="/strategy">
            <ChevronLeft aria-hidden size={13} />
            Strategy
          </Link>
        }
        description="Construisez le contexte de marché à partir des alternatives, capacités uniques, valeur et segments les plus adaptés."
        eyebrow="Obviously Awesome"
        title="Positioning"
      />

      <div className="strategy-framework-note">
        <Sparkles aria-hidden size={17} />
        <p>
          Chaque élément est qualifié comme confirmé, inféré, hypothèse ou
          manquant. Aucune sortie IA n’est considérée comme un fait sans preuve.
        </p>
      </div>

      {!selectedArtifact || !selectedVersion ? (
        <EmptyState
          action={
            <StrategyCreateDraftForm
              artifactType="positioning"
              canWrite={canWrite}
            />
          }
          description="Créez une première version pour structurer le positionnement du client actif."
          icon={<Compass aria-hidden size={20} />}
          title="Aucun positionnement"
        />
      ) : (
        <div className="strategy-workspace-layout">
          <StrategyVersionHistory
            artifact={selectedArtifact}
            artifactType="positioning"
            selectedVersionId={selectedVersion.id}
          />
          <StrategyVersionEditor
            artifact={selectedArtifact}
            artifactType="positioning"
            canWrite={canWrite}
            evidence={workspace.evidence}
            fields={positioningFields}
            version={selectedVersion}
          />
          <StrategyEvidencePanel
            canWrite={canWrite}
            evidence={workspace.evidence}
          />
        </div>
      )}
    </section>
  );
}
