import "server-only";

import { z } from "zod";

import { DomainError } from "@/domain/errors/domain-error";
import type { StrategyArtifactType } from "@/domain/strategy/strategy-artifact";
import { getRequestedPermissionSnapshot } from "@/lib/authorization/server-permissions";
import { createServerStrategyModule } from "@/lib/strategy/server-strategy-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";

const optionalUuid = z.uuid().optional();

export async function getStrategyPageData(
  artifactType: StrategyArtifactType,
  rawQuery: Readonly<Record<string, string | string[] | undefined>>,
) {
  try {
    const artifactId = optionalUuid.parse(
      typeof rawQuery.artifact === "string" ? rawQuery.artifact : undefined,
    );
    const versionId = optionalUuid.parse(
      typeof rawQuery.version === "string" ? rawQuery.version : undefined,
    );
    const { supabase, tenant } = await resolveActiveClientTenant("offer.read");
    const { context, service } = createServerStrategyModule(supabase, tenant);
    const [workspace, permissionSnapshot] = await Promise.all([
      service.findWorkspace(artifactType, context),
      getRequestedPermissionSnapshot({
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
      }),
    ]);
    const selectedArtifact =
      workspace.artifacts.find((artifact) => artifact.id === artifactId) ??
      workspace.artifacts[0] ??
      null;
    const selectedVersion =
      selectedArtifact?.versions.find((version) => version.id === versionId) ??
      selectedArtifact?.versions.find(
        (version) => version.status === "draft",
      ) ??
      selectedArtifact?.versions[0] ??
      null;

    return {
      ok: true as const,
      data: {
        workspace,
        selectedArtifact,
        selectedVersion,
        canWrite: permissionSnapshot.permissions.includes("offer.write"),
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof DomainError
          ? error.publicMessage
          : "Les données de stratégie sont temporairement indisponibles.",
    };
  }
}
