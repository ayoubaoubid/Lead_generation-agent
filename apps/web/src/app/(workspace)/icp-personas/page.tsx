import { Layers3, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { TargetingAiForm } from "@/features/targeting/components/targeting-ai-form";
import { TargetingCreateForm } from "@/features/targeting/components/targeting-create-form";
import { TargetingEditor } from "@/features/targeting/components/targeting-editor";
import { getTargetingPageData } from "@/features/targeting/targeting.queries";

export const metadata: Metadata = { title: "ICP & Personas" };

type IcpPersonasPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function IcpPersonasPage({
  searchParams,
}: IcpPersonasPageProps) {
  const result = await getTargetingPageData(await searchParams);
  if (!result.ok) {
    return (
      <section className="workspace-page targeting-page">
        <PageHeader title="ICP & Personas" />
        <ErrorState description={result.message} title="Ciblage indisponible" />
      </section>
    );
  }

  const {
    canPropose,
    canValidate,
    canWrite,
    profileType,
    selectedProfile,
    selectedVersion,
    workspace,
  } = result.data;

  return (
    <section className="workspace-page targeting-page">
      <PageHeader
        actions={
          <TargetingCreateForm canWrite={canWrite} profileType={profileType} />
        }
        description="Formalisez qui cibler, pourquoi, avec quels signaux observables et quelles hypothèses restent à vérifier."
        eyebrow="Mom Test · validation humaine"
        title="ICP & Personas"
      />

      <nav aria-label="Type de profil" className="targeting-type-tabs">
        <Link
          aria-current={profileType === "icp" ? "page" : undefined}
          className={profileType === "icp" ? "is-active" : undefined}
          href="/icp-personas?type=icp"
        >
          ICP
        </Link>
        <Link
          aria-current={profileType === "persona" ? "page" : undefined}
          className={profileType === "persona" ? "is-active" : undefined}
          href="/icp-personas?type=persona"
        >
          Personas
        </Link>
      </nav>

      <div className="targeting-safety-note">
        <ShieldCheck aria-hidden size={17} />
        <p>
          Une sortie IA n’est jamais activée automatiquement. Les hypothèses et
          preuves manquantes restent visibles jusqu’à validation humaine.
        </p>
      </div>

      <TargetingAiForm canPropose={canPropose} profileType={profileType} />

      {workspace.profiles.length > 0 ? (
        <nav
          aria-label={
            profileType === "icp" ? "ICP du client" : "Personas du client"
          }
          className="targeting-profile-list"
        >
          {workspace.profiles.map((profile) => (
            <Link
              aria-current={
                profile.id === selectedProfile?.id ? "page" : undefined
              }
              className={
                profile.id === selectedProfile?.id ? "is-active" : undefined
              }
              href={`/icp-personas?type=${profileType}&profile=${profile.id}`}
              key={profile.id}
            >
              <span>
                <strong>{profile.name}</strong>
                <small>{profile.versions.length} version(s)</small>
              </span>
              <Badge
                tone={
                  profile.lifecycleStatus === "active"
                    ? "success"
                    : profile.lifecycleStatus === "archived"
                      ? "danger"
                      : "neutral"
                }
              >
                {profile.lifecycleStatus}
              </Badge>
            </Link>
          ))}
        </nav>
      ) : null}

      {!selectedProfile || !selectedVersion ? (
        <EmptyState
          description={
            profileType === "icp"
              ? "Créez un ICP manuellement ou demandez une proposition fondée sur les informations observées."
              : "Créez un persona sans supposer ses comportements, son budget ou son pouvoir de décision."
          }
          icon={<Layers3 aria-hidden size={20} />}
          title={profileType === "icp" ? "Aucun ICP" : "Aucun persona"}
        />
      ) : (
        <div className="targeting-workspace">
          <aside className="targeting-version-list">
            <h2>Historique</h2>
            {selectedProfile.versions.map((version) => (
              <Link
                aria-current={
                  version.id === selectedVersion.id ? "page" : undefined
                }
                className={
                  version.id === selectedVersion.id ? "is-active" : undefined
                }
                href={`/icp-personas?type=${profileType}&profile=${selectedProfile.id}&version=${version.id}`}
                key={version.id}
              >
                <span>Version {version.versionNumber}</span>
                <small>
                  {version.status === "validated" ? "Validée" : "Brouillon"} ·{" "}
                  {version.origin === "ai_proposal" ? "IA" : "manuel"}
                </small>
              </Link>
            ))}
            <TargetingCreateForm
              canWrite={canWrite}
              profileType={profileType}
              sourceName={selectedProfile.name}
              sourceProfileId={selectedProfile.id}
            />
          </aside>
          <TargetingEditor
            canValidate={canValidate}
            canWrite={canWrite}
            profile={selectedProfile}
            version={selectedVersion}
          />
        </div>
      )}
    </section>
  );
}
