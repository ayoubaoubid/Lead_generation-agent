"use client";

import { Archive } from "lucide-react";
import { useActionState } from "react";

import { Button, Dialog, FormField, Input } from "@/components/ui";
import { archiveClientAction } from "@/features/clients/client.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function ArchiveClientDialog({
  clientId,
  clientName,
}: Readonly<{ clientId: string; clientName: string }>) {
  const [state, formAction, pending] = useActionState(
    archiveClientAction,
    initialTenantActionState,
  );

  return (
    <Dialog
      description="Cette opération retire le client des vues actives et bloque ses modifications. Elle est auditée."
      title={`Archiver ${clientName}`}
      trigger={
        <Button
          iconLeading={<Archive aria-hidden size={15} />}
          size="sm"
          variant="danger"
        >
          Archiver
        </Button>
      }
    >
      <form action={formAction} className="client-archive-form">
        <input name="clientId" type="hidden" value={clientId} />
        <p>
          Pour confirmer, saisissez <strong>ARCHIVER</strong>. Aucun envoi ou
          traitement en cours n’est lancé par cette action.
        </p>
        <FormField
          error={state.fieldErrors?.confirmation?.[0]}
          htmlFor="archive-confirmation"
          label="Confirmation"
        >
          <Input
            autoComplete="off"
            id="archive-confirmation"
            invalid={Boolean(state.fieldErrors?.confirmation?.[0])}
            name="confirmation"
            placeholder="ARCHIVER"
          />
        </FormField>
        {state.message ? (
          <p
            className={`client-form-message client-form-message--${state.status}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}
        <Button loading={pending} type="submit" variant="danger">
          Confirmer l’archivage
        </Button>
      </form>
    </Dialog>
  );
}
