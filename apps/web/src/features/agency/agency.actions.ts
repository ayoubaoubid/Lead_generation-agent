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
  resolveActiveAgencyTenant,
  setActiveAgencyCookie,
} from "@/lib/tenancy/server-tenant-context";
import { SupabaseAdminConfigurationError } from "@/lib/supabase/admin";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  acceptAgencyMembershipSchema,
  assignRecruiterClientsSchema,
  createAgencySchema,
  inviteRecruiterSchema,
  selectAgencySchema,
} from "@/validations/tenancy/tenancy.schema";

import { resolveOrInviteRecruiter } from "@/services/agency/recruiter-invitation.service";

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function stringFields(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
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

export async function inviteRecruiterAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = inviteRecruiterSchema.safeParse({
    email: stringField(formData, "email"),
    clientIds: stringFields(formData, "clientIds"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { supabase, tenant, user } = await resolveActiveAgencyTenant([
      "member.invite",
      "member.assign_role",
    ]);
    const invitation = await resolveOrInviteRecruiter(parsed.data.email);

    if (invitation.user.id === user.id) {
      return {
        status: "error",
        message:
          "Le propriétaire de l’agence ne peut pas être affecté comme Recruiter.",
      };
    }

    const { error } = await supabase.rpc("invite_or_assign_recruiter", {
      requested_agency_id: tenant.agencyId,
      requested_client_ids: parsed.data.clientIds,
      requested_profile_id: invitation.user.id,
    });

    if (error) {
      return {
        status: "error",
        message:
          "L’invitation existe peut-être déjà, mais les affectations n’ont pas pu être enregistrées.",
      };
    }

    revalidatePath("/settings");
    revalidatePath("/clients");

    return tenantActionSuccessState(
      invitation.invitationSent
        ? "Invitation envoyée. Les clients sélectionnés seront accessibles après activation du compte."
        : "Le Recruiter existant a été affecté aux clients sélectionnés.",
      invitation.user.id,
    );
  } catch (error) {
    if (error instanceof SupabaseAdminConfigurationError) {
      return {
        status: "error",
        message:
          "L’invitation nécessite SUPABASE_SERVICE_ROLE_KEY côté serveur.",
      };
    }

    return tenantActionErrorState(error);
  }
}

export async function assignRecruiterClientsAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = assignRecruiterClientsSchema.safeParse({
    profileId: stringField(formData, "profileId"),
    clientIds: stringFields(formData, "clientIds"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { supabase, tenant } = await resolveActiveAgencyTenant([
      "member.invite",
      "member.assign_role",
    ]);
    const { error } = await supabase.rpc("invite_or_assign_recruiter", {
      requested_agency_id: tenant.agencyId,
      requested_client_ids: parsed.data.clientIds,
      requested_profile_id: parsed.data.profileId,
    });

    if (error) {
      return {
        status: "error",
        message:
          "Les affectations du Recruiter n’ont pas pu être enregistrées.",
      };
    }

    revalidatePath("/settings");
    revalidatePath("/clients");
    return tenantActionSuccessState(
      "Les clients ont été affectés au Recruiter.",
      parsed.data.profileId,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
