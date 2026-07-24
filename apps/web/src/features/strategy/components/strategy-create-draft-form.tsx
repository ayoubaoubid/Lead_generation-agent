"use client";

import { FilePlus2 } from "lucide-react";
import { useActionState } from "react";

import { Button, FormField, Input } from "@/components/ui";
import type { StrategyArtifactType } from "@/domain/strategy/strategy-artifact";
import { StrategyActionMessage } from "@/features/strategy/components/strategy-action-message";
import { createStrategyDraftAction } from "@/features/strategy/strategy.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function StrategyCreateDraftForm({
  artifactId,
  artifactType,
  canWrite,
  name,
}: Readonly<{
  artifactId?: string;
  artifactType: StrategyArtifactType;
  canWrite: boolean;
  name?: string;
}>) {
  const [state, action, pending] = useActionState(
    createStrategyDraftAction,
    initialTenantActionState,
  );
  const isNewOffer = artifactType === "offer" && !artifactId;

  if (!canWrite) return null;

  return (
    <form action={action} className="strategy-create-form">
      <input name="artifactType" type="hidden" value={artifactType} />
      {artifactId ? (
        <input name="artifactId" type="hidden" value={artifactId} />
      ) : null}
      {isNewOffer ? (
        <FormField htmlFor="new-offer-name" label="Nom de l’offre">
          <Input
            disabled={pending}
            id="new-offer-name"
            maxLength={160}
            name="name"
            placeholder="Ex. Accélérateur outbound"
            required
          />
        </FormField>
      ) : (
        <input
          name="name"
          type="hidden"
          value={
            artifactType === "positioning"
              ? "Positionnement"
              : (name ?? "Offre")
          }
        />
      )}
      <Button
        iconLeading={<FilePlus2 aria-hidden size={15} />}
        loading={pending}
        size="sm"
        type="submit"
        variant={isNewOffer ? "primary" : "secondary"}
      >
        {isNewOffer
          ? "Créer l’offre"
          : artifactId
            ? "Créer une nouvelle version"
            : "Commencer le brouillon"}
      </Button>
      <StrategyActionMessage state={state} />
    </form>
  );
}
