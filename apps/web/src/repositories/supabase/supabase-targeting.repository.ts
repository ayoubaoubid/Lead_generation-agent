import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  IcpContent,
  PersonaContent,
  TargetingProfile,
  TargetingProfileType,
  TargetingVersion,
} from "@/domain/targeting/targeting-profile";
import type {
  CreateAiTargetingProposalRecord,
  CreateTargetingDraftRecord,
  CreateTargetingVersionRecord,
  SaveTargetingDraftRecord,
  SetTargetingLifecycleRecord,
  TargetingRepository,
  ValidateTargetingVersionRecord,
} from "@/repositories/contracts/targeting.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";
import {
  icpContentSchema,
  personaContentSchema,
} from "@/validations/targeting/targeting-profile.schema";

type ProfileRow = Database["public"]["Tables"]["targeting_profiles"]["Row"];
type VersionRow = Database["public"]["Tables"]["targeting_versions"]["Row"];

function requireClientContext(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped targeting context required.",
    );
  }
  return context.tenant;
}

function mutationFailure(error: { code?: string; message: string }): never {
  const conflictCodes = new Set(["23505", "23514", "42501", "55000"]);
  throw new RepositoryError(
    error.code && conflictCodes.has(error.code) ? "conflict" : "unavailable",
    "Targeting persistence failed.",
    error,
  );
}

function icpToJson(content: IcpContent): Json {
  return {
    rationale: [...content.rationale],
    industries: [...content.industries],
    countries: [...content.countries],
    companySizes: [...content.companySizes],
    employeeCount: { ...content.employeeCount },
    annualRevenue: { ...content.annualRevenue },
    technologies: [...content.technologies],
    maturityLevels: [...content.maturityLevels],
    budget: { ...content.budget },
    problems: [...content.problems],
    intentSignals: [...content.intentSignals],
    exclusions: [...content.exclusions],
    scoringWeights: content.scoringWeights.map((item) => ({ ...item })),
    assumptions: [...content.assumptions],
    missingEvidence: [...content.missingEvidence],
  };
}

function personaToJson(content: PersonaContent): Json {
  return {
    rationale: [...content.rationale],
    jobTitles: [...content.jobTitles],
    departments: [...content.departments],
    seniorityLevels: [...content.seniorityLevels],
    responsibilities: [...content.responsibilities],
    goals: [...content.goals],
    problems: [...content.problems],
    objections: [...content.objections],
    decisionPower: content.decisionPower,
    buyingRoles: [...content.buyingRoles],
    preferredChannels: [...content.preferredChannels],
    assumptions: [...content.assumptions],
    missingEvidence: [...content.missingEvidence],
  };
}

function contentToJson(
  content: IcpContent | PersonaContent,
  profileType: TargetingProfileType,
): Json {
  return profileType === "icp"
    ? icpToJson(icpContentSchema.parse(content))
    : personaToJson(personaContentSchema.parse(content));
}

function mapVersion(
  row: VersionRow,
  profileType: TargetingProfileType,
): TargetingVersion {
  const parsed =
    profileType === "icp"
      ? icpContentSchema.safeParse(row.content)
      : personaContentSchema.safeParse(row.content);
  if (!parsed.success) {
    throw new RepositoryError(
      "unexpected_response",
      "Persisted targeting content is invalid.",
      parsed.error,
    );
  }

  return {
    id: row.id,
    profileId: row.profile_id,
    versionNumber: row.version_number,
    status: row.status,
    origin: row.origin,
    content: parsed.data,
    sourceVersionId: row.source_version_id,
    aiExecutionId: row.ai_execution_id,
    aiModelId: row.ai_model_id,
    aiSkillName: row.ai_skill_id,
    aiSkillVersion: row.ai_skill_version,
    aiPromptVersion: row.ai_prompt_version,
    aiInputTokens: row.input_tokens,
    aiOutputTokens: row.output_tokens,
    aiCostMicrousd: row.technical_cost_microusd,
    validatedBy: row.validated_by,
    validatedAt: row.validated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseTargetingRepository implements TargetingRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findWorkspace(
    profileType: TargetingProfileType,
    context: RepositoryContext,
  ) {
    const tenant = requireClientContext(context);
    const profilesResult = await this.supabase
      .from("targeting_profiles")
      .select("*")
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .eq("profile_type", profileType)
      .order("updated_at", { ascending: false });

    if (profilesResult.error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load targeting profiles.",
        profilesResult.error,
      );
    }

    let versionRows: VersionRow[] = [];
    if (profilesResult.data.length > 0) {
      const versionsResult = await this.supabase
        .from("targeting_versions")
        .select("*")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .in(
          "profile_id",
          profilesResult.data.map(({ id }) => id),
        )
        .order("version_number", { ascending: false });
      if (versionsResult.error) {
        throw new RepositoryError(
          "unavailable",
          "Unable to load targeting version history.",
          versionsResult.error,
        );
      }
      versionRows = versionsResult.data;
    }

    const profiles: TargetingProfile[] = profilesResult.data.map(
      (profile: ProfileRow) => ({
        id: profile.id,
        profileType: profile.profile_type,
        name: profile.name,
        lifecycleStatus: profile.lifecycle_status,
        activatedAt: profile.activated_at,
        archivedAt: profile.archived_at,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        versions: versionRows
          .filter((version) => version.profile_id === profile.id)
          .map((version) => mapVersion(version, profileType)),
      }),
    );
    return { profiles };
  }

  async createDraft(
    input: CreateTargetingDraftRecord,
    context: RepositoryContext,
  ) {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc("create_targeting_draft", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_profile_type: input.profileType,
      requested_name: input.name,
      ...(input.sourceProfileId
        ? { requested_source_profile_id: input.sourceProfileId }
        : {}),
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Targeting draft creation returned no id." },
      );
    }
    return data;
  }

  async createVersion(
    input: CreateTargetingVersionRecord,
    context: RepositoryContext,
  ) {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc(
      "create_targeting_version",
      {
        requested_agency_id: tenant.agencyId,
        requested_client_id: tenant.clientId,
        requested_profile_id: input.profileId,
        requested_profile_type: input.profileType,
      },
    );
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Targeting version creation returned no id." },
      );
    }
    return data;
  }

  async saveDraft(input: SaveTargetingDraftRecord, context: RepositoryContext) {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc("save_targeting_draft", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_version_id: input.versionId,
      requested_profile_type: input.profileType,
      requested_name: input.name,
      requested_content: contentToJson(input.content, input.profileType),
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Targeting draft save returned no id." },
      );
    }
    return data;
  }

  async validateVersion(
    input: ValidateTargetingVersionRecord,
    context: RepositoryContext,
  ) {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc(
      "validate_targeting_version",
      {
        requested_agency_id: tenant.agencyId,
        requested_client_id: tenant.clientId,
        requested_version_id: input.versionId,
        requested_profile_type: input.profileType,
      },
    );
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Targeting validation returned no id." },
      );
    }
    return data;
  }

  async setLifecycle(
    input: SetTargetingLifecycleRecord,
    context: RepositoryContext,
  ) {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc("set_targeting_lifecycle", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_profile_id: input.profileId,
      requested_profile_type: input.profileType,
      requested_lifecycle_status: input.lifecycleStatus,
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Targeting lifecycle update returned no id." },
      );
    }
    return data;
  }

  async createAiProposal(
    input: CreateAiTargetingProposalRecord,
    context: RepositoryContext,
  ) {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc(
      "create_ai_targeting_proposal",
      {
        requested_agency_id: tenant.agencyId,
        requested_client_id: tenant.clientId,
        requested_profile_type: input.profileType,
        requested_name: input.name,
        requested_content: contentToJson(input.content, input.profileType),
        requested_execution_id: input.executionId,
        requested_model_id: input.modelId,
        requested_skill_version: input.skillVersion,
        requested_prompt_version: input.promptVersion,
        requested_input_tokens: input.inputTokens,
        requested_output_tokens: input.outputTokens,
        requested_cost_microusd: input.costMicrousd,
        requested_pricing_version: input.pricingVersion,
      },
    );
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "AI targeting proposal returned no id." },
      );
    }
    return data;
  }
}
