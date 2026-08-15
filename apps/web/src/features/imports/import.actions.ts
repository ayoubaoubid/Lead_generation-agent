"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { createServerLeadDataModule } from "@/lib/lead-data/server-lead-data-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";

export async function cancelDataImportAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z.uuid().safeParse(formData.get("importId"));
  if (!parsed.success) return tenantValidationErrorState(parsed.error);
  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "lead.read",
      "lead.write",
    ]);
    const { imports, context } = createServerLeadDataModule(supabase, tenant);
    await imports.requestCancellation(parsed.data, context);
    revalidatePath("/imports");
    revalidatePath(`/imports/${parsed.data}`);
    return tenantActionSuccessState(
      "La demande d’annulation a été enregistrée.",
      parsed.data,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
