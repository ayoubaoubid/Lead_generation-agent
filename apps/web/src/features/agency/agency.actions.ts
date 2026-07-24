"use server";

import { revalidatePath } from "next/cache";

import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  clearActiveClientCookie,
  resolveRequestedServerTenant,
  setActiveAgencyCookie,
} from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  acceptAgencyMembershipSchema,
  createAgencySchema,
  selectAgencySchema,
} from "@/validations/tenancy/tenancy.schema";

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createAgencyAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = createAgencySchema.safeParse({
    name: stringField(formData, "name"),
    slug: stringField(formData, "slug"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        status: "error",
        message: "Vous devez être connecté pour continuer.",
      };
    }

    const { data: agencyId, error } = await supabase.rpc("create_agency", {
      requested_name: parsed.data.name,
      requested_slug: parsed.data.slug,
    });

    if (error || !agencyId) {
      return {
        status: "error",
        message: "L’agence n’a pas pu être créée.",
      };
    }

    await setActiveAgencyCookie(agencyId);
    await clearActiveClientCookie();
    revalidatePath("/");

    return tenantActionSuccessState("L’agence a été créée.", agencyId);
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function selectActiveAgencyAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = selectAgencySchema.safeParse({
    agencyId: stringField(formData, "agencyId"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { tenant } = await resolveRequestedServerTenant({
      agencyId: parsed.data.agencyId,
    });
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("select_active_agency", {
      requested_agency_id: tenant.agencyId,
    });

    if (error) {
      return {
        status: "error",
        message: "L’agence active n’a pas pu être sélectionnée.",
      };
    }

    await setActiveAgencyCookie(tenant.agencyId);
    await clearActiveClientCookie();
    revalidatePath("/");

    return tenantActionSuccessState("L’agence active a été sélectionnée.");
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function acceptAgencyMembershipAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = acceptAgencyMembershipSchema.safeParse({
    membershipId: stringField(formData, "membershipId"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        status: "error",
        message: "Vous devez être connecté pour continuer.",
      };
    }

    const { data: agencyId, error } = await supabase.rpc(
      "accept_agency_membership",
      {
        requested_membership_id: parsed.data.membershipId,
      },
    );

    if (error || !agencyId) {
      return {
        status: "error",
        message: "Cette invitation n’est plus disponible.",
      };
    }

    await setActiveAgencyCookie(agencyId);
    await clearActiveClientCookie();
    revalidatePath("/");

    return tenantActionSuccessState("Vous avez rejoint l’agence.");
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
