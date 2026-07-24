import { Clock3 } from "lucide-react";

import type { OnboardingHistoryEntry } from "@/domain/onboarding/onboarding";
import { onboardingSections } from "@/features/onboarding/onboarding-section-config";

const sectionLabels = new Map(
  onboardingSections.map((section) => [section.key, section.shortTitle]),
);

export function OnboardingHistory({
  history,
}: Readonly<{ history: readonly OnboardingHistoryEntry[] }>) {
  return (
    <section className="onboarding-history">
      <div className="onboarding-panel-heading">
        <Clock3 aria-hidden size={17} />
        <div>
          <h2>Historique récent</h2>
          <p>Les 20 dernières modifications enregistrées.</p>
        </div>
      </div>
      {history.length === 0 ? (
        <p className="onboarding-history-empty">
          Aucune modification n’a encore été enregistrée.
        </p>
      ) : (
        <ol>
          {history.map((entry) => (
            <li key={entry.id}>
              <span
                className={
                  entry.isComplete
                    ? "onboarding-history-dot onboarding-history-dot--complete"
                    : "onboarding-history-dot"
                }
              />
              <div>
                <strong>{sectionLabels.get(entry.sectionKey)}</strong>
                <span>
                  Révision {entry.revision} ·{" "}
                  {entry.isComplete ? "étape complète" : "brouillon"}
                </span>
              </div>
              <time dateTime={entry.changedAt}>
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(entry.changedAt))}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
