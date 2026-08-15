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
import { createCompanySchema } from "@/validations/companies/company.schema";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createCompanyAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = createCompanySchema.safeParse({
    name: field(formData, "name"),
    domain: field(formData, "domain"),
    websiteUrl: field(formData, "websiteUrl"),
    industry: field(formData, "industry"),
    countryCode: field(formData, "countryCode"),
    employeeCount: field(formData, "employeeCount"),
    annualRevenue: field(formData, "annualRevenue"),
    revenueCurrency: field(formData, "revenueCurrency"),
    technologies: field(formData, "technologies"),
    description: field(formData, "description"),
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
    const { companies, context } = createServerLeadDataModule(supabase, tenant);
    const id = await companies.create(parsed.data, context);
    revalidatePath("/companies");
    return tenantActionSuccessState("L’entreprise a été créée.", id);
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function archiveCompanyAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z.uuid().safeParse(field(formData, "companyId"));
  if (!parsed.success) return tenantValidationErrorState(parsed.error);
  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "lead.read",
      "lead.write",
    ]);
    const { companies, context } = createServerLeadDataModule(supabase, tenant);
    await companies.archive(parsed.data, context);
    revalidatePath("/companies");
    return tenantActionSuccessState(
      "L’entreprise a été archivée.",
      parsed.data,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
