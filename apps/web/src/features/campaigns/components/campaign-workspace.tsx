"use client";

import { useActionState } from "react";

import type { CampaignSummary } from "@/domain/campaigns/campaign";
import {
  createCampaignDraftAction,
  transitionCampaignAction,
} from "@/features/campaigns/campaign.actions";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { initialTenantActionState } from "@/types/tenant-action-state";

type Props = Readonly<{
  campaigns: readonly CampaignSummary[];
  canCreate: boolean;
  canWrite: boolean;
  canApprove: boolean;
  canLaunch: boolean;
  timezone: string;
}>;

const statusLabels: Record<CampaignSummary["status"], string> = {
  draft: "Brouillon",
  ready_for_review: "À valider",
  approved: "Approuvée",
  scheduled: "Planifiée",
  running: "En cours",
  paused: "En pause",
  completed: "Terminée",
  cancelled: "Annulée",
};

export function CampaignWorkspace(props: Props) {
  const [createState, createAction, createPending] = useActionState(
    createCampaignDraftAction,
    initialTenantActionState,
  );
  const [transitionState, transitionAction, transitionPending] = useActionState(
    transitionCampaignAction,
    initialTenantActionState,
  );

  return (
    <div className="campaign-layout">
      <section className="campaign-panel campaign-panel--form">
        <div>
          <p className="campaign-eyebrow">Nouvelle campagne</p>
          <h2>Préparer un brouillon contrôlé</h2>
          <p>
            Aucun envoi n’est possible avant la revue, l’approbation et les
            contrôles de délivrabilité.
          </p>
        </div>
        <form action={createAction} className="campaign-form">
          <Input name="name" placeholder="Ex. SaaS France — Q3" required />
          <Textarea
            name="objective"
            placeholder="Objectif opérationnel et résultat attendu"
            required
          />
          <div className="campaign-form-grid">
            <Select
              name="channel"
              defaultValue="email"
              ariaLabel="Canal"
              options={[
                { label: "Email", value: "email" },
                { label: "LinkedIn manuel", value: "linkedin" },
                { label: "Multicanal", value: "multichannel" },
              ]}
            />
            <Input name="timezone" defaultValue={props.timezone} required />
          </div>
          <Input
            name="sequenceName"
            defaultValue="Séquence principale"
            required
          />
          <Input name="templateSubject" placeholder="Objet initial" />
          <Textarea
            name="templateBody"
            placeholder="Brouillon initial — il pourra être remplacé par une variante IA validée"
            required
          />
          <Button
            type="submit"
            loading={createPending}
            disabled={!props.canCreate}
          >
            Créer le brouillon
          </Button>
          {createState.message ? (
            <p
              className={`campaign-feedback campaign-feedback--${createState.status}`}
            >
              {createState.message}
            </p>
          ) : null}
        </form>
      </section>

      <section className="campaign-panel">
        <div className="campaign-list-header">
          <div>
            <p className="campaign-eyebrow">Portefeuille actif</p>
            <h2>Campagnes</h2>
          </div>
          <span>{props.campaigns.length} campagne(s)</span>
        </div>
        {props.campaigns.length === 0 ? (
          <div className="campaign-empty">
            <strong>Aucune campagne pour ce client</strong>
            <p>Créez un premier brouillon pour structurer la prospection.</p>
          </div>
        ) : (
          <div className="campaign-list">
            {props.campaigns.map((campaign) => (
              <article className="campaign-card" key={campaign.id}>
                <div className="campaign-card-heading">
                  <div>
                    <span
                      className={`campaign-status campaign-status--${campaign.status}`}
                    >
                      {statusLabels[campaign.status]}
                    </span>
                    <h3>{campaign.name}</h3>
                  </div>
                  <span>{campaign.channel}</span>
                </div>
                <p>{campaign.objective}</p>
                <div className="campaign-card-meta">
                  <span>{campaign.timezone}</span>
                  <span>
                    Mis à jour{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                    }).format(new Date(campaign.updatedAt))}
                  </span>
                </div>
                <form action={transitionAction} className="campaign-actions">
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  {campaign.status === "draft" && props.canWrite ? (
                    <Button
                      size="sm"
                      name="action"
                      value="submit"
                      disabled={transitionPending}
                    >
                      Soumettre
                    </Button>
                  ) : null}
                  {campaign.status === "ready_for_review" &&
                  props.canApprove ? (
                    <Button
                      size="sm"
                      name="action"
                      value="approve"
                      disabled={transitionPending}
                    >
                      Approuver
                    </Button>
                  ) : null}
                  {campaign.status === "approved" && props.canLaunch ? (
                    <>
                      <Input
                        name="scheduledStartAt"
                        aria-label="Date de planification"
                        placeholder="2026-08-15T09:00:00+01:00"
                      />
                      <Button
                        size="sm"
                        name="action"
                        value="schedule"
                        disabled={transitionPending}
                      >
                        Planifier
                      </Button>
                    </>
                  ) : null}
                </form>
              </article>
            ))}
          </div>
        )}
        {transitionState.message ? (
          <p
            className={`campaign-feedback campaign-feedback--${transitionState.status}`}
          >
            {transitionState.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
