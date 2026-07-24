"use client";

import { BookOpenCheck, ExternalLink, Plus } from "lucide-react";
import { useActionState } from "react";

import { Badge, Button, FormField, Input, Textarea } from "@/components/ui";
import type { StrategyEvidence } from "@/domain/strategy/strategy-artifact";
import { StrategyActionMessage } from "@/features/strategy/components/strategy-action-message";
import { createStrategyEvidenceAction } from "@/features/strategy/strategy.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

const classificationLabels = {
  confirmed: "Confirmé",
  inferred: "Inféré",
  hypothesis: "Hypothèse",
} as const;

export function StrategyEvidencePanel({
  canWrite,
  evidence,
}: Readonly<{
  canWrite: boolean;
  evidence: readonly StrategyEvidence[];
}>) {
  const [state, action, pending] = useActionState(
    createStrategyEvidenceAction,
    initialTenantActionState,
  );

  return (
    <aside className="strategy-evidence-panel">
      <div className="strategy-panel-heading">
        <BookOpenCheck aria-hidden size={18} />
        <div>
          <h2>Registre de preuves</h2>
          <p>Une source est obligatoire pour toute preuve confirmée.</p>
        </div>
      </div>

      {canWrite ? (
        <details className="strategy-evidence-create">
          <summary>
            <Plus aria-hidden size={14} />
            Ajouter une preuve
          </summary>
          <form action={action}>
            <div className="strategy-two-columns">
              <FormField htmlFor="evidence-type" label="Type">
                <select
                  className="ui-input"
                  defaultValue="document"
                  disabled={pending}
                  id="evidence-type"
                  name="evidenceType"
                >
                  <option value="customer_case">Cas client</option>
                  <option value="testimonial">Témoignage</option>
                  <option value="statistic">Statistique</option>
                  <option value="document">Document</option>
                  <option value="internal_data">Donnée interne</option>
                  <option value="authorization">
                    Autorisation de garantie
                  </option>
                  <option value="other">Autre</option>
                </select>
              </FormField>
              <FormField htmlFor="evidence-classification" label="Statut">
                <select
                  className="ui-input"
                  defaultValue="confirmed"
                  disabled={pending}
                  id="evidence-classification"
                  name="classification"
                >
                  <option value="confirmed">Confirmé</option>
                  <option value="inferred">Inféré</option>
                  <option value="hypothesis">Hypothèse</option>
                </select>
              </FormField>
            </div>
            <FormField htmlFor="evidence-title" label="Titre">
              <Input
                disabled={pending}
                id="evidence-title"
                maxLength={200}
                name="title"
                required
              />
            </FormField>
            <FormField htmlFor="evidence-description" label="Description">
              <Textarea
                disabled={pending}
                id="evidence-description"
                maxLength={4000}
                name="description"
                required
                rows={3}
              />
            </FormField>
            <FormField
              htmlFor="evidence-source-reference"
              label="Référence de source"
              optional
            >
              <Input
                disabled={pending}
                id="evidence-source-reference"
                maxLength={500}
                name="sourceReference"
                placeholder="Document, entretien, page ou autorisation"
              />
            </FormField>
            <FormField
              htmlFor="evidence-source-url"
              label="URL source"
              optional
            >
              <Input
                disabled={pending}
                id="evidence-source-url"
                maxLength={2048}
                name="sourceUrl"
                type="url"
              />
            </FormField>
            <Button loading={pending} size="sm" type="submit">
              Enregistrer la preuve
            </Button>
            <StrategyActionMessage state={state} />
          </form>
        </details>
      ) : null}

      <div className="strategy-evidence-list">
        {evidence.length === 0 ? (
          <p className="strategy-muted">Aucune preuve enregistrée.</p>
        ) : (
          evidence.map((item) => (
            <article key={item.id}>
              <div>
                <Badge
                  tone={
                    item.classification === "confirmed"
                      ? "success"
                      : item.classification === "inferred"
                        ? "brand"
                        : "warning"
                  }
                >
                  {classificationLabels[item.classification]}
                </Badge>
                <span>{item.evidenceType.replaceAll("_", " ")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.sourceUrl ? (
                <a href={item.sourceUrl} rel="noreferrer" target="_blank">
                  Voir la source
                  <ExternalLink aria-hidden size={12} />
                </a>
              ) : item.sourceReference ? (
                <small>{item.sourceReference}</small>
              ) : null}
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
