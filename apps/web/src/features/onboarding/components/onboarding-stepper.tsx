import { Check, LockKeyhole } from "lucide-react";
import Link from "next/link";

import type {
  OnboardingSectionKey,
  OnboardingSession,
} from "@/domain/onboarding/onboarding";
import { onboardingSections } from "@/features/onboarding/onboarding-section-config";

export function OnboardingStepper({
  activeStep,
  session,
}: Readonly<{ activeStep: number; session: OnboardingSession }>) {
  return (
    <nav aria-label="Étapes de l’onboarding" className="onboarding-stepper">
      <ol>
        {onboardingSections.map((section, index) => {
          const step = index + 1;
          const answer = session.answers[section.key as OnboardingSectionKey];
          const isComplete = Boolean(answer?.isComplete);
          const isActive = activeStep === step;

          return (
            <li key={section.key}>
              <Link
                aria-current={isActive ? "step" : undefined}
                className={[
                  "onboarding-step-link",
                  isActive ? "onboarding-step-link--active" : "",
                  isComplete ? "onboarding-step-link--complete" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                href={`/strategy/onboarding?step=${step}`}
              >
                <span className="onboarding-step-number">
                  {isComplete ? <Check aria-hidden size={13} /> : step}
                </span>
                <span>
                  <strong>{section.shortTitle}</strong>
                  <small>
                    {isComplete
                      ? "Complète"
                      : answer
                        ? "Brouillon enregistré"
                        : "À renseigner"}
                  </small>
                </span>
                {session.status === "validated" ? (
                  <LockKeyhole aria-hidden size={13} />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
