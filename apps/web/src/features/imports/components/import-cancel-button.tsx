"use client";

import { Ban } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui";
import { cancelDataImportAction } from "@/features/imports/import.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function ImportCancelButton({
  importId,
}: Readonly<{ importId: string }>) {
  const [state, action, pending] = useActionState(
    cancelDataImportAction,
    initialTenantActionState,
  );
  return (
    <form action={action}>
      <input name="importId" type="hidden" value={importId} />
      <Button
        iconLeading={<Ban aria-hidden size={15} />}
        loading={pending}
        title={state.message}
        type="submit"
        variant="secondary"
      >
        Annuler
      </Button>
    </form>
  );
}
