"use server";

import { revalidatePath } from "next/cache";

import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import {
  resolveActiveAgencyTenant,
  resolveRequestedServerTenant,
} from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  assignAgencyMemberSchema,
  assignClientMemberSchema,
} from "@/validations/tenancy/tenancy.schema";

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function assignAgencyMemberAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = assignAgencyMemberSchema.safeParse({
    profileId: stringField(formData, "profileId"),
    roleId: stringField(formData, "roleId"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { supabase, tenant } = await resolveActiveAgencyTenant([
      "member.invite",
      "member.assign_role",
    ]);
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("id", parsed.data.roleId)
      .eq("agency_id", tenant.agencyId)
      .eq("scope", "agency")
      .is("client_id", null)
      .is("archived_at", null)
      .maybeSingle();

    if (roleError || !role) {
      return {
        status: "error",
        message: "Le rôle sélectionné n’est pas disponible.",
      };
    }

    const { error } = await supabase.rpc("assign_agency_member", {
      requested_agency_id: tenant.agencyId,
      requested_profile_id: parsed.data.profileId,
      requested_role_id: role.id,
    });

    if (error) {
      return {
        status: "error",
        message: "L’utilisateur n’a pas pu être affecté à l’agence.",
      };
    }

    revalidatePath("/");
    return tenantActionSuccessState(
      "L’utilisateur a été invité dans l’agence.",
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function assignClientMemberAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = assignClientMemberSchema.safeParse({
    clientId: stringField(formData, "clientId"),
    profileId: stringField(formData, "profileId"),
    roleId: stringField(formData, "roleId"),
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
      ["member.invite", "member.assign_role"],
    );

    if (tenant.scope !== "client") {
      return {
        status: "error",
        message: "Le client sélectionné n’est pas disponible.",
      };
    }

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("id", parsed.data.roleId)
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .eq("scope", "client")
      .is("archived_at", null)
      .maybeSingle();

    if (roleError || !role) {
      return {
        status: "error",
        message: "Le rôle sélectionné n’est pas disponible.",
      };
    }

    const { error } = await supabase.rpc("assign_client_member", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_profile_id: parsed.data.profileId,
      requested_role_id: role.id,
    });

    if (error) {
      return {
        status: "error",
        message: "L’utilisateur n’a pas pu être affecté au client.",
      };
    }

    revalidatePath("/");
    revalidatePath(`/clients/${tenant.clientId}`);
    return tenantActionSuccessState(
      "L’utilisateur a été invité dans l’espace client.",
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
