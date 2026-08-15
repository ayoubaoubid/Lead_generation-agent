"use client";

import { useActionState } from "react";

import { Button, Input, Textarea } from "@/components/ui";
import type { CampaignMessageVariant } from "@/domain/messages/campaign-message";
import {
  editCampaignMessageAction,
  reviewCampaignMessageAction,
  submitCampaignMessageAction,
} from "@/features/campaigns/message.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

type Props = Readonly<{
  variants: readonly CampaignMessageVariant[];
  canWrite: boolean;
  canApprove: boolean;
}>;

const statusLabels: Record<CampaignMessageVariant["status"], string> = {
  draft: "Brouillon",
  quality_review_pending: "Revue qualité",
  compliance_review_pending: "Revue conformité",
  human_review_pending: "Validation humaine",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export function MessageReviewWorkspace({
  variants,
  canWrite,
  canApprove,
}: Props) {
  const [editState, editAction, editPending] = useActionState(
    editCampaignMessageAction,
    initialTenantActionState,
  );
  const [submitState, submitAction, submitPending] = useActionState(
    submitCampaignMessageAction,
    initialTenantActionState,
  );
  const [reviewState, reviewAction, reviewPending] = useActionState(
    reviewCampaignMessageAction,
    initialTenantActionState,
  );

  return (
    <section className="campaign-panel campaign-messages">
      <div className="campaign-list-header">
        <div>
          <p className="campaign-eyebrow">Message control room</p>
          <h2>Variantes et validation humaine</h2>
          <p>
            Chaque modification crée une version distincte. Une approbation ne
            s’applique jamais aux versions suivantes.
          </p>
        </div>
        <span>{variants.length} variante(s)</span>
      </div>

      {variants.length === 0 ? (
        <div className="campaign-empty">
          <strong>Aucune variante générée</strong>
          <p>
            Les variantes apparaîtront après préparation des destinataires et
            génération asynchrone. Aucun texte fictif n’est affiché.
          </p>
        </div>
      ) : (
        <div className="message-variant-grid">
          {variants.map((variant) => (
            <article className="message-variant-card" key={variant.id}>
              <header>
                <div>
                  <span
                    className={`campaign-status campaign-status--${variant.status}`}
                  >
                    {statusLabels[variant.status]}
                  </span>
                  <h3>
                    Variante {variant.versionNumber} · {variant.wordCount} mots
                  </h3>
                </div>
                <code>{variant.origin}</code>
              </header>
              <p className="message-subject">
                {variant.subject ?? "Sans objet"}
              </p>
              <p className="message-body">{variant.body}</p>
              <footer>
                <span>CTA · {variant.callToAction}</span>
                <span>
                  {variant.groundedStatements.length} fait(s) sourcé(s)
                </span>
              </footer>

              {variant.status === "draft" && canWrite ? (
                <div className="message-actions-stack">
                  <form action={editAction} className="message-edit-form">
                    <input
                      type="hidden"
                      name="sourceVersionId"
                      value={variant.id}
                    />
                    <Input
                      name="subject"
                      aria-label="Objet"
                      defaultValue={variant.subject ?? ""}
                    />
                    <Textarea
                      name="body"
                      aria-label="Corps"
                      defaultValue={variant.body}
                      required
                    />
                    <Input
                      name="mainIdea"
                      aria-label="Idée principale"
                      defaultValue={variant.mainIdea}
                      required
                    />
                    <Input
                      name="callToAction"
                      aria-label="Appel à l’action"
                      defaultValue={variant.callToAction}
                      required
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      loading={editPending}
                    >
                      Enregistrer une nouvelle variante
                    </Button>
                  </form>
                  <form action={submitAction}>
                    <input type="hidden" name="versionId" value={variant.id} />
                    <Button type="submit" size="sm" loading={submitPending}>
                      Lancer les revues
                    </Button>
                  </form>
                </div>
              ) : null}

              {variant.status === "human_review_pending" && canApprove ? (
                <form action={reviewAction} className="campaign-actions">
                  <input type="hidden" name="versionId" value={variant.id} />
                  <Button
                    type="submit"
                    name="decision"
                    value="approve"
                    size="sm"
                    loading={reviewPending}
                  >
                    Approuver cette version
                  </Button>
                  <Button
                    type="submit"
                    name="decision"
                    value="reject"
                    variant="secondary"
                    size="sm"
                    disabled={reviewPending}
                  >
                    Rejeter
                  </Button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {[editState, submitState, reviewState].map((state, index) =>
        state.message ? (
          <p
            className={`campaign-feedback campaign-feedback--${state.status}`}
            key={`${state.status}-${index}`}
          >
            {state.message}
          </p>
        ) : null,
      )}
    </section>
  );
}
