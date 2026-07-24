"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { createServerClientModule } from "@/lib/clients/server-client-module";
import {
  clearActiveClientCookieIfMatches,
  resolveActiveAgencyTenant,
  resolveRequestedServerTenant,
  setActiveClientCookie,
} from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  archiveClientSchema,
  createClientProfileSchema,
  updateClientProfileSchema,
} from "@/validations/clients/client.schema";
import { selectClientSchema } from "@/validations/tenancy/tenancy.schema";

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function profileFields(formData: FormData) {
  return {
    name: stringField(formData, "name"),
    slug: stringField(formData, "slug"),
    legalName: stringField(formData, "legalName"),
    websiteUrl: stringField(formData, "websiteUrl"),
    industry: stringField(formData, "industry"),
    countryCode: stringField(formData, "countryCode"),
    languageCode: stringField(formData, "languageCode"),
    timezone: stringField(formData, "timezone"),
    description: stringField(formData, "description"),
    logoUrl: stringField(formData, "logoUrl"),
    objectives: stringField(formData, "objectives"),
  };
}

export async function createClientAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = createClientProfileSchema.safeParse({
    ...profileFields(formData),
    status: stringField(formData, "status"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  let clientId: string;
  try {
    const { supabase, tenant } =
      await resolveActiveAgencyTenant("client.create");
    const { context, service } = createServerClientModule(supabase, tenant);
    clientId = await service.create(parsed.data, context);
    await setActiveClientCookie(clientId);
  } catch (error) {
    return tenantActionErrorState(error);
  }

  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function updateClientAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = updateClientProfileSchema.safeParse({
    clientId: stringField(formData, "clientId"),
    ...profileFields(formData),
    status: stringField(formData, "status"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { tenant: agencyTenant } = await resolveActiveAgencyTenant();
    const { supabase, tenant } = await resolveRequestedServerTenant(
      {
        agencyId: agencyTenant.agencyId,
        clientId: parsed.data.clientId,
      },
      "client.manage",
    );
    const { context, service } = createServerClientModule(supabase, tenant);
    await service.update(parsed.data, context);

    revalidatePath("/clients");
    revalidatePath(`/clients/${parsed.data.clientId}`);
    return tenantActionSuccessState("Les informations du client sont à jour.");
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function archiveClientAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = archiveClientSchema.safeParse({
    clientId: stringField(formData, "clientId"),
    confirmation: stringField(formData, "confirmation"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { tenant: agencyTenant } = await resolveActiveAgencyTenant();
    const { supabase, tenant } = await resolveRequestedServerTenant(
      {
        agencyId: agencyTenant.agencyId,
        clientId: parsed.data.clientId,
      },
      "client.archive",
    );
    const { context, service } = createServerClientModule(supabase, tenant);
    await service.archive(parsed.data.clientId, context);
    await clearActiveClientCookieIfMatches(parsed.data.clientId);
  } catch (error) {
    return tenantActionErrorState(error);
  }

  revalidatePath("/clients");
  redirect("/clients?notice=archived");
}

export async function selectActiveClientAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = selectClientSchema.safeParse({
    clientId: stringField(formData, "clientId"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { tenant: activeAgency } = await resolveActiveAgencyTenant();
    const { tenant } = await resolveRequestedServerTenant({
      agencyId: activeAgency.agencyId,
      clientId: parsed.data.clientId,
    });

    if (tenant.scope !== "client") {
      return {
        status: "error",
        message: "Le client sélectionné n’est pas accessible.",
      };
    }

    await setActiveClientCookie(tenant.clientId);
    revalidatePath("/");

    return tenantActionSuccessState("Le client actif a été sélectionné.");
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
