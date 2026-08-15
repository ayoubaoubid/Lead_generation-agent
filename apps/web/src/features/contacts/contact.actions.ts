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
import { createContactSchema } from "@/validations/contacts/contact.schema";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createContactAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = createContactSchema.safeParse({
    companyId: field(formData, "companyId"),
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    linkedinUrl: field(formData, "linkedinUrl"),
    jobTitle: field(formData, "jobTitle"),
    department: field(formData, "department"),
    seniority: field(formData, "seniority"),
    phone: field(formData, "phone"),
    countryCode: field(formData, "countryCode"),
    factStatus: field(formData, "factStatus") || "confirmed",
    confidenceScore: field(formData, "confidenceScore"),
    sourceProvider: field(formData, "sourceProvider"),
    externalId: field(formData, "externalId"),
    sourceUrl: field(formData, "sourceUrl"),
    collectedAt: null,
  });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "lead.read",
      "lead.write",
    ]);
    const { contacts, context } = createServerLeadDataModule(supabase, tenant);
    const id = await contacts.create(parsed.data, context);
    revalidatePath("/contacts");
    return tenantActionSuccessState("Le contact a été créé.", id);
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function archiveContactAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z.uuid().safeParse(field(formData, "contactId"));
  if (!parsed.success) return tenantValidationErrorState(parsed.error);
  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "lead.read",
      "lead.write",
    ]);
    const { contacts, context } = createServerLeadDataModule(supabase, tenant);
    await contacts.archive(parsed.data, context);
    revalidatePath("/contacts");
    return tenantActionSuccessState("Le contact a été archivé.", parsed.data);
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
