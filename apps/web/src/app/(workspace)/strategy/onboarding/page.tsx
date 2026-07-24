import {
  BrainCircuit,
  ChevronLeft,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, ErrorState, PageHeader } from "@/components/ui";
import { OnboardingHistory } from "@/features/onboarding/components/onboarding-history";
import { OnboardingLifecycleActions } from "@/features/onboarding/components/onboarding-lifecycle-actions";
import { OnboardingStepForm } from "@/features/onboarding/components/onboarding-step-form";
import { OnboardingStepper } from "@/features/onboarding/components/onboarding-stepper";
import { getOnboardingPageData } from "@/features/onboarding/onboarding.queries";
import { getOnboardingSectionConfig } from "@/features/onboarding/onboarding-section-config";

export const metadata: Metadata = { title: "Onboarding client" };

type OnboardingPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const statusPresentation = {
  draft: { label: "Brouillon", tone: "warning" },
  completed: { label: "Terminé", tone: "brand" },
  validated: { label: "Validé", tone: "success" },
} as const;

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const result = await getOnboardingPageData(await searchParams);

  if (!result.ok) {
    return (
      <div className="workspace-page onboarding-page">
        <PageHeader
          breadcrumbs={
            <Link className="client-back-link" href="/strategy">
              <ChevronLeft aria-hidden size={13} />
              Strategy
            </Link>
          }
          title="Onboarding client"
        />
        <ErrorState
          description={result.message}
          title="Onboarding indisponible"
        />
      </div>
    );
  }

  const {
    canValidate,
    canWrite,
    preparedSkillContexts,
    progress,
    query,
    session,
  } = result.data;
  const section = getOnboardingSectionConfig(query.step);
  const status = statusPresentation[session.status];

  return (
    <div className="workspace-page onboarding-page">
      <PageHeader
        actions={
          <OnboardingLifecycleActions
            canValidate={canValidate}
            canWrite={canWrite}
            completedStepCount={session.completedStepCount}
            status={session.status}
          />
        }
        breadcrumbs={
          <Link className="client-back-link" href="/strategy">
            <ChevronLeft aria-hidden size={13} />
            Strategy
          </Link>
        }
        description="Collecte structurée des informations commerciales du client actif."
        eyebrow="Client strategy"
        title="Onboarding"
      />

      <section className="onboarding-progress-card">
        <div className="onboarding-progress-copy">
          <span className="onboarding-progress-icon">
            <ClipboardCheck aria-hidden size={19} />
          </span>
          <div>
            <div className="onboarding-progress-title">
              <strong>{progress}% complété</strong>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            <p>
              {session.completedStepCount} étape
              {session.completedStepCount === 1 ? "" : "s"} complète
              {session.completedStepCount === 1 ? "" : "s"} sur 14
            </p>
          </div>
        </div>
        <div
          aria-label="Progression de l’onboarding"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="onboarding-progress-track"
          role="progressbar"
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <div className="onboarding-layout">
        <OnboardingStepper activeStep={query.step} session={session} />
        <main className="onboarding-main">
          <OnboardingStepForm
            answer={session.answers[section.key]}
            canWrite={canWrite}
            config={section}
            status={session.status}
            step={query.step}
          />

          <section className="onboarding-skill-readiness">
            <div className="onboarding-panel-heading">
              <BrainCircuit aria-hidden size={18} />
              <div>
                <h2>Préparation des skills</h2>
                <p>
                  Les réponses complètes seront assemblées dans des contextes
                  structurés et tenant-scoped.
                </p>
              </div>
            </div>
            <div className="onboarding-skill-list">
              {[
                "Mom Test",
                "Four Steps",
                "Obviously Awesome",
                "100M Offers",
                "100M Leads",
              ].map((skill) => (
                <span key={skill}>
                  <ShieldCheck aria-hidden size={13} />
                  {skill}
                </span>
              ))}
            </div>
            <p className="onboarding-skill-note">
              {preparedSkillContexts.length === 5
                ? "Les cinq contextes sont prêts. Aucun agent IA n’a été lancé."
                : "Les contextes seront disponibles après la soumission complète. Aucun agent IA n’est lancé automatiquement."}
            </p>
          </section>

          <OnboardingHistory history={session.history} />
        </main>
      </div>
    </div>
  );
}
