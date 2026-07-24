import { Layers3, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { StrategyCreateDraftForm } from "@/features/strategy/components/strategy-create-draft-form";
import { StrategyEvidencePanel } from "@/features/strategy/components/strategy-evidence-panel";
import { StrategyVersionEditor } from "@/features/strategy/components/strategy-version-editor";
import { StrategyVersionHistory } from "@/features/strategy/components/strategy-version-history";
import { offerFields } from "@/features/strategy/strategy-field-config";
import { getStrategyPageData } from "@/features/strategy/strategy.queries";

export const metadata: Metadata = { title: "Offers" };

type OffersPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const result = await getStrategyPageData("offer", await searchParams);

  if (!result.ok) {
    return (
      <section className="workspace-page strategy-artifact-page">
        <PageHeader title="Offers" />
        <ErrorState description={result.message} title="Offres indisponibles" />
      </section>
    );
  }

  const { canWrite, selectedArtifact, selectedVersion, workspace } =
    result.data;

  return (
    <section className="workspace-page strategy-artifact-page">
      <PageHeader
        actions={
          <StrategyCreateDraftForm artifactType="offer" canWrite={canWrite} />
        }
        description="Structurez les résultats désirés, promesses, délais, obstacles et garanties autorisées du client actif."
        eyebrow="100M Offers"
        title="Offers"
      />

      <div className="strategy-framework-note">
        <Sparkles aria-hidden size={17} />
        <p>
          Une garantie confirmée exige une preuve de type autorisation. Les
          résultats et promesses ne deviennent jamais confirmés par simple
          génération IA.
        </p>
      </div>

      {workspace.artifacts.length > 0 ? (
        <nav aria-label="Offres du client" className="strategy-artifact-tabs">
          {workspace.artifacts.map((artifact) => (
            <Link
              aria-current={
                artifact.id === selectedArtifact?.id ? "page" : undefined
              }
              className={
                artifact.id === selectedArtifact?.id
                  ? "strategy-artifact-tab strategy-artifact-tab--active"
                  : "strategy-artifact-tab"
              }
              href={`/offers?artifact=${artifact.id}`}
              key={artifact.id}
            >
              <span>{artifact.name}</span>
              <Badge tone="neutral">
                {artifact.versions.length} version(s)
              </Badge>
            </Link>
          ))}
        </nav>
      ) : null}

      {!selectedArtifact || !selectedVersion ? (
        <EmptyState
          description="Créez une première offre sans inventer de résultat, preuve ou garantie."
          icon={<Layers3 aria-hidden size={20} />}
          title="Aucune offre"
        />
      ) : (
        <>
          {!selectedArtifact.versions.some(
            (version) => version.status === "draft",
          ) ? (
            <div className="strategy-new-version">
              <StrategyCreateDraftForm
                artifactId={selectedArtifact.id}
                artifactType="offer"
                canWrite={canWrite}
                name={selectedArtifact.name}
              />
            </div>
          ) : null}
          <div className="strategy-workspace-layout">
            <StrategyVersionHistory
              artifact={selectedArtifact}
              artifactType="offer"
              selectedVersionId={selectedVersion.id}
            />
            <StrategyVersionEditor
              artifact={selectedArtifact}
              artifactType="offer"
              canWrite={canWrite}
              evidence={workspace.evidence}
              fields={offerFields}
              version={selectedVersion}
            />
            <StrategyEvidencePanel
              canWrite={canWrite}
              evidence={workspace.evidence}
            />
          </div>
        </>
      )}
    </section>
  );
}
