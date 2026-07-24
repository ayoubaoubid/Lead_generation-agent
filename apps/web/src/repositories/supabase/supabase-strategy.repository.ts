import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  StrategyArtifact,
  StrategyArtifactType,
  StrategyEvidence,
  StrategyVersion,
  StrategyWorkspace,
} from "@/domain/strategy/strategy-artifact";
import type {
  CreateStrategyDraftRecord,
  CreateStrategyEvidenceRecord,
  SaveStrategyDraftRecord,
  StrategyRepository,
  ValidateStrategyVersionRecord,
} from "@/repositories/contracts/strategy.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";
import {
  offerContentSchema,
  positioningContentSchema,
} from "@/validations/strategy/strategy-artifact.schema";

type ArtifactRow = Database["public"]["Tables"]["strategy_artifacts"]["Row"];
type EvidenceRow = Database["public"]["Tables"]["strategy_evidence"]["Row"];
type VersionRow = Database["public"]["Tables"]["strategy_versions"]["Row"];

function requireClientContext(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped strategy context required.",
    );
  }

  return context.tenant;
}

function mutationFailure(error: { code?: string; message: string }): never {
  const conflictCodes = new Set(["23505", "23514", "42501", "55000"]);
  throw new RepositoryError(
    error.code && conflictCodes.has(error.code) ? "conflict" : "unavailable",
    "Strategy persistence failed.",
    error,
  );
}

function mapVersion(
  row: VersionRow,
  artifactType: StrategyArtifactType,
): StrategyVersion {
  const expectedFramework =
    artifactType === "positioning" ? "obviously-awesome" : "100m-offers";
  if (row.framework !== expectedFramework) {
    throw new RepositoryError(
      "unexpected_response",
      "The persisted strategy framework is invalid.",
    );
  }

  const content =
    artifactType === "positioning"
      ? positioningContentSchema.safeParse(row.content)
      : offerContentSchema.safeParse(row.content);
  if (!content.success) {
    throw new RepositoryError(
      "unexpected_response",
      "The persisted strategy content is invalid.",
      content.error,
    );
  }

  return {
    id: row.id,
    artifactId: row.artifact_id,
    versionNumber: row.version_number,
    status: row.status,
    content: content.data,
    framework: expectedFramework,
    frameworkVersion: row.framework_version,
    validatedBy: row.validated_by,
    validatedAt: row.validated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvidence(row: EvidenceRow): StrategyEvidence {
  if (row.classification === "missing") {
    throw new RepositoryError(
      "unexpected_response",
      "Evidence cannot use the missing classification.",
    );
  }

  return {
    id: row.id,
    evidenceType: row.evidence_type,
    title: row.title,
    description: row.description,
    classification: row.classification,
    sourceUrl: row.source_url,
    sourceReference: row.source_reference,
    createdAt: row.created_at,
  };
}

export class SupabaseStrategyRepository implements StrategyRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findWorkspace(
    artifactType: StrategyArtifactType,
    context: RepositoryContext,
  ): Promise<StrategyWorkspace> {
    const tenant = requireClientContext(context);
    const [artifactsResult, evidenceResult] = await Promise.all([
      this.supabase
        .from("strategy_artifacts")
        .select("*")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("artifact_type", artifactType)
        .order("updated_at", { ascending: false }),
      this.supabase
        .from("strategy_evidence")
        .select("*")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (artifactsResult.error || evidenceResult.error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load strategy workspace.",
        artifactsResult.error ?? evidenceResult.error,
      );
    }

    const artifactRows = artifactsResult.data;
    let versionRows: VersionRow[] = [];
    if (artifactRows.length > 0) {
      const versionsResult = await this.supabase
        .from("strategy_versions")
        .select("*")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .in(
          "artifact_id",
          artifactRows.map((artifact) => artifact.id),
        )
        .order("version_number", { ascending: false });

      if (versionsResult.error) {
        throw new RepositoryError(
          "unavailable",
          "Unable to load strategy version history.",
          versionsResult.error,
        );
      }
      versionRows = versionsResult.data;
    }

    const artifacts: StrategyArtifact[] = artifactRows.map(
      (artifact: ArtifactRow) => ({
        id: artifact.id,
        artifactType: artifact.artifact_type,
        name: artifact.name,
        createdAt: artifact.created_at,
        updatedAt: artifact.updated_at,
        versions: versionRows
          .filter((version) => version.artifact_id === artifact.id)
          .map((version) => mapVersion(version, artifactType)),
      }),
    );

    return {
      artifacts,
      evidence: evidenceResult.data.map(mapEvidence),
    };
  }

  async createEvidence(
    input: CreateStrategyEvidenceRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc(
      "create_strategy_evidence",
      {
        requested_agency_id: tenant.agencyId,
        requested_client_id: tenant.clientId,
        requested_evidence_type: input.evidenceType,
        requested_title: input.title,
        requested_description: input.description,
        requested_classification: input.classification,
        requested_source_url: input.sourceUrl,
        requested_source_reference: input.sourceReference,
      },
    );

    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Evidence creation returned no identifier." },
      );
    }
    return data;
  }

  async createDraft(
    input: CreateStrategyDraftRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const tenant = requireClientContext(context);
    const result =
      input.artifactType === "positioning"
        ? await this.supabase.rpc("create_positioning_draft", {
            requested_agency_id: tenant.agencyId,
            requested_client_id: tenant.clientId,
          })
        : await this.supabase.rpc("create_offer_draft", {
            requested_agency_id: tenant.agencyId,
            requested_client_id: tenant.clientId,
            requested_name: input.name,
            ...(input.artifactId
              ? { requested_artifact_id: input.artifactId }
              : {}),
          });

    if (result.error || !result.data) {
      return mutationFailure(
        result.error ?? { message: "Draft creation returned no identifier." },
      );
    }
    return result.data;
  }

  async saveDraft(
    input: SaveStrategyDraftRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const tenant = requireClientContext(context);
    const content: Json = input.content.map((item) => ({
      kind: item.kind,
      value: item.value,
      classification: item.classification,
      evidenceIds: [...item.evidenceIds],
    }));
    const result =
      input.artifactType === "positioning"
        ? await this.supabase.rpc("save_positioning_draft", {
            requested_agency_id: tenant.agencyId,
            requested_client_id: tenant.clientId,
            requested_version_id: input.versionId,
            requested_content: content,
          })
        : await this.supabase.rpc("save_offer_draft", {
            requested_agency_id: tenant.agencyId,
            requested_client_id: tenant.clientId,
            requested_version_id: input.versionId,
            requested_name: input.name,
            requested_content: content,
          });

    if (result.error || !result.data) {
      return mutationFailure(
        result.error ?? { message: "Draft save returned no identifier." },
      );
    }
    return result.data;
  }

  async validateVersion(
    input: ValidateStrategyVersionRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const tenant = requireClientContext(context);
    const result =
      input.artifactType === "positioning"
        ? await this.supabase.rpc("validate_positioning_version", {
            requested_agency_id: tenant.agencyId,
            requested_client_id: tenant.clientId,
            requested_version_id: input.versionId,
          })
        : await this.supabase.rpc("validate_offer_version", {
            requested_agency_id: tenant.agencyId,
            requested_client_id: tenant.clientId,
            requested_version_id: input.versionId,
          });

    if (result.error || !result.data) {
      return mutationFailure(
        result.error ?? { message: "Validation returned no identifier." },
      );
    }
    return result.data;
  }
}
