"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";

export async function ensureDefaultPipelineAction(): Promise<void> {
  const { supabase, tenant } =
    await resolveActiveClientTenant("pipeline.write");
  const response = await supabase.rpc("ensure_default_pipeline", {
    requested_agency_id: tenant.agencyId,
    requested_client_id: tenant.clientId,
  });
  if (response.error) throw response.error;
  revalidatePath("/pipeline");
}

const sendingDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/,
  );

export async function createSendingDomainAction(
  formData: FormData,
): Promise<void> {
  const domain = sendingDomainSchema.parse(formData.get("domain"));
  const { supabase, tenant } =
    await resolveActiveClientTenant("settings.manage");
  const response = await supabase.rpc("upsert_sending_domain", {
    requested_agency_id: tenant.agencyId,
    requested_client_id: tenant.clientId,
    requested_domain: domain,
  });
  if (response.error) throw response.error;
  revalidatePath("/integrations");
}
