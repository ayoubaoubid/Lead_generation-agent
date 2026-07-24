import "server-only";

import { z } from "zod";

import { DomainError } from "@/domain/errors/domain-error";
import { getRequestedPermissionSnapshot } from "@/lib/authorization/server-permissions";
import { createServerTargetingModule } from "@/lib/targeting/server-targeting-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import { targetingProfileTypeSchema } from "@/validations/targeting/targeting-profile.schema";

const optionalUuid = z.uuid().optional();

export async function getTargetingPageData(
  rawQuery: Readonly<Record<string, string | string[] | undefined>>,
) {
  try {
    const profileType = targetingProfileTypeSchema
      .catch("icp")
      .parse(typeof rawQuery.type === "string" ? rawQuery.type : "icp");
    const profileId = optionalUuid.parse(
      typeof rawQuery.profile === "string" ? rawQuery.profile : undefined,
    );
    const versionId = optionalUuid.parse(
      typeof rawQuery.version === "string" ? rawQuery.version : undefined,
    );
    const { supabase, tenant } =
      await resolveActiveClientTenant("targeting.read");
    const { context, service } = createServerTargetingModule(supabase, tenant);
    const [workspace, permissionSnapshot] = await Promise.all([
      service.findWorkspace(profileType, context),
      getRequestedPermissionSnapshot({
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
      }),
    ]);
    const selectedProfile =
      workspace.profiles.find((profile) => profile.id === profileId) ??
      workspace.profiles.find(
        (profile) => profile.lifecycleStatus !== "archived",
      ) ??
      workspace.profiles[0] ??
      null;
    const selectedVersion =
      selectedProfile?.versions.find((version) => version.id === versionId) ??
      selectedProfile?.versions.find((version) => version.status === "draft") ??
      selectedProfile?.versions[0] ??
      null;
    const permissions = permissionSnapshot.permissions;

    return {
      ok: true as const,
      data: {
        profileType,
        workspace,
        selectedProfile,
        selectedVersion,
        canWrite: permissions.includes("targeting.write"),
        canValidate: permissions.includes("targeting.validate"),
        canPropose: permissions.includes("targeting.propose"),
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof DomainError
          ? error.publicMessage
          : "Les ICP et personas sont temporairement indisponibles.",
    };
  }
}
