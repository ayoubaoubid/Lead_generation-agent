"use client";

import { Archive } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui";
import { archiveCompanyAction } from "@/features/companies/company.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function CompanyArchiveButton({
  companyId,
}: Readonly<{ companyId: string }>) {
  const [state, action, pending] = useActionState(
    archiveCompanyAction,
    initialTenantActionState,
  );
  return (
    <form action={action}>
      <input name="companyId" type="hidden" value={companyId} />
      <Button
        aria-label="Archiver l’entreprise"
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
