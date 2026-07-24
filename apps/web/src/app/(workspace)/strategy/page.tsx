import type { Metadata } from "next";
import { ArrowRight, ClipboardList, Compass } from "lucide-react";
import Link from "next/link";

import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Strategy" };

export default function StrategyPage() {
  return (
    <section className="workspace-page onboarding-entry-page">
      <PageHeader
        description="Collectez d’abord les faits du client avant de construire son positionnement, son offre et ses cibles."
        eyebrow="Client strategy"
        title="Strategy"
      />
      <div className="onboarding-entry-card">
        <span className="onboarding-entry-icon">
          <ClipboardList aria-hidden size={23} />
        </span>
        <div>
          <Badge tone="brand">Première étape</Badge>
          <h2>Onboarding structuré</h2>
          <p>
            Quatorze sections, sauvegarde progressive, validation par étape et
            historique complet des modifications.
          </p>
          <Link className="onboarding-entry-link" href="/strategy/onboarding">
            Ouvrir l’onboarding
            <ArrowRight aria-hidden size={15} />
          </Link>
        </div>
      </div>
      <div className="onboarding-entry-card">
        <span className="onboarding-entry-icon">
          <Compass aria-hidden size={23} />
        </span>
        <div>
          <Badge tone="warning">Obviously Awesome</Badge>
          <h2>Positioning</h2>
          <p>
            Alternatives, capacités uniques, valeur, segments, preuves et
            différenciateurs avec validation humaine.
          </p>
          <Link className="onboarding-entry-link" href="/strategy/positioning">
            Construire le positionnement
            <ArrowRight aria-hidden size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
