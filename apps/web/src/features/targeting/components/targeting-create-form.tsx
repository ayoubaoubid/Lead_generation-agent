"use client";

import { CopyPlus, FilePlus2 } from "lucide-react";
import { useActionState } from "react";

import { Button, FormField, Input } from "@/components/ui";
import type { TargetingProfileType } from "@/domain/targeting/targeting-profile";
import { TargetingActionMessage } from "@/features/targeting/components/targeting-action-message";
import { createTargetingDraftAction } from "@/features/targeting/targeting.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function TargetingCreateForm({
  canWrite,
  profileType,
  sourceProfileId,
  sourceName,
}: Readonly<{
  canWrite: boolean;
  profileType: TargetingProfileType;
  sourceProfileId?: string;
  sourceName?: string;
}>) {
  const [state, action, pending] = useActionState(
    createTargetingDraftAction,
    initialTenantActionState,
  );
  if (!canWrite) return null;
  const duplicate = Boolean(sourceProfileId);

  return (
    <form action={action} className="targeting-create-form">
      <input name="profileType" type="hidden" value={profileType} />
      <input
        name="sourceProfileId"
        type="hidden"
        value={sourceProfileId ?? ""}
      />
      <FormField
        htmlFor={`targeting-name-${sourceProfileId ?? profileType}`}
        label={duplicate ? "Nom de la copie" : "Nom du profil"}
      >
        <Input
          defaultValue={duplicate ? `${sourceName ?? "Profil"} — copie` : ""}
          disabled={pending}
          id={`targeting-name-${sourceProfileId ?? profileType}`}
          maxLength={160}
          name="name"
          placeholder={
            profileType === "icp"
              ? "Ex. PME industrielles France"
              : "Ex. Directrice commerciale"
          }
          required
        />
      </FormField>
      <Button
        iconLeading={
          duplicate ? (
            <CopyPlus aria-hidden size={15} />
          ) : (
            <FilePlus2 aria-hidden size={15} />
          )
        }
        loading={pending}
        size="sm"
        type="submit"
        variant={duplicate ? "secondary" : "primary"}
      >
        {duplicate ? "Dupliquer" : "Créer manuellement"}
      </Button>
      <TargetingActionMessage state={state} />
    </form>
  );
}
