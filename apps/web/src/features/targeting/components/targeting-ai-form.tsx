"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";

import { Button, FormField, Textarea } from "@/components/ui";
import type { TargetingProfileType } from "@/domain/targeting/targeting-profile";
import { TargetingActionMessage } from "@/features/targeting/components/targeting-action-message";
import { proposeTargetingWithAiAction } from "@/features/targeting/targeting.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function TargetingAiForm({
  canPropose,
  profileType,
}: Readonly<{
  canPropose: boolean;
  profileType: TargetingProfileType;
}>) {
  const [state, action, pending] = useActionState(
    proposeTargetingWithAiAction,
    initialTenantActionState,
  );
  if (!canPropose) return null;

  return (
    <details className="targeting-ai-panel">
      <summary>
        <Sparkles aria-hidden size={16} />
        Préparer une proposition IA
      </summary>
      <form action={action}>
        <input name="profileType" type="hidden" value={profileType} />
        <FormField
          hint="Décrivez uniquement ce que vous savez. Les zones non prouvées seront classées comme hypothèses ou preuves manquantes."
          htmlFor={`targeting-objective-${profileType}`}
          label="Contexte observé et objectif"
        >
          <Textarea
            disabled={pending}
            id={`targeting-objective-${profileType}`}
            maxLength={8000}
            minLength={20}
            name="objective"
            placeholder="Marché, clients déjà observés, comportements passés, problèmes exprimés et critères à explorer…"
            required
            rows={6}
          />
        </FormField>
        <div className="targeting-ai-disclaimer">
          La proposition restera inactive et devra être relue, corrigée puis
          validée par une personne autorisée.
        </div>
        <Button
          iconLeading={<Sparkles aria-hidden size={15} />}
          loading={pending}
          type="submit"
        >
          Générer un brouillon
        </Button>
        <TargetingActionMessage state={state} />
      </form>
    </details>
  );
}
