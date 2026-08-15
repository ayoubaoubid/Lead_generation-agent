"use client";

import { Archive } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui";
import { archiveContactAction } from "@/features/contacts/contact.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function ContactArchiveButton({
  contactId,
}: Readonly<{ contactId: string }>) {
  const [state, action, pending] = useActionState(
    archiveContactAction,
    initialTenantActionState,
  );
  return (
    <form action={action}>
      <input name="contactId" type="hidden" value={contactId} />
      <Button
        aria-label="Archiver le contact"
        loading={pending}
        size="icon"
        title={state.message ?? "Archiver"}
        type="submit"
        variant="ghost"
      >
        <Archive aria-hidden size={15} />
      </Button>
    </form>
  );
}
