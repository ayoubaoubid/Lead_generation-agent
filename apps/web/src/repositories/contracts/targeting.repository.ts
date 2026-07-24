import type {
  TargetingContent,
  TargetingLifecycleStatus,
  TargetingProfileType,
  TargetingWorkspace,
} from "@/domain/targeting/targeting-profile";
import type { RepositoryContext } from "@/repositories/repository-context";

export type CreateTargetingDraftRecord = Readonly<{
  profileType: TargetingProfileType;
  name: string;
  sourceProfileId?: string;
}>;

export type CreateTargetingVersionRecord = Readonly<{
  profileType: TargetingProfileType;
  profileId: string;
}>;

export type SaveTargetingDraftRecord = Readonly<{
  profileType: TargetingProfileType;
  versionId: string;
  name: string;
  content: TargetingContent;
}>;

export type ValidateTargetingVersionRecord = Readonly<{
  profileType: TargetingProfileType;
  versionId: string;
}>;

export type SetTargetingLifecycleRecord = Readonly<{
  profileType: TargetingProfileType;
  profileId: string;
  lifecycleStatus: Extract<TargetingLifecycleStatus, "active" | "archived">;
}>;

export type CreateAiTargetingProposalRecord = Readonly<{
  profileType: TargetingProfileType;
  name: string;
  content: TargetingContent;
  executionId: string;
  modelId: string;
  skillVersion: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costMicrousd: number;
  pricingVersion: string;
}>;

export interface TargetingRepository {
  findWorkspace(
    profileType: TargetingProfileType,
    context: RepositoryContext,
  ): Promise<TargetingWorkspace>;
  createDraft(
    input: CreateTargetingDraftRecord,
    context: RepositoryContext,
  ): Promise<string>;
  createVersion(
    input: CreateTargetingVersionRecord,
    context: RepositoryContext,
  ): Promise<string>;
  saveDraft(
    input: SaveTargetingDraftRecord,
    context: RepositoryContext,
  ): Promise<string>;
  validateVersion(
    input: ValidateTargetingVersionRecord,
    context: RepositoryContext,
  ): Promise<string>;
  setLifecycle(
    input: SetTargetingLifecycleRecord,
    context: RepositoryContext,
  ): Promise<string>;
  createAiProposal(
    input: CreateAiTargetingProposalRecord,
    context: RepositoryContext,
  ): Promise<string>;
}
