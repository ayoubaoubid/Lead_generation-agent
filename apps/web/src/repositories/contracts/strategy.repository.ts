import type {
  StrategyArtifactType,
  StrategyClaimStatus,
  StrategyContentItem,
  StrategyEvidenceType,
  StrategyWorkspace,
} from "@/domain/strategy/strategy-artifact";
import type { RepositoryContext } from "@/repositories/repository-context";

export type CreateStrategyEvidenceRecord = Readonly<{
  evidenceType: StrategyEvidenceType;
  title: string;
  description: string;
  classification: Exclude<StrategyClaimStatus, "missing">;
  sourceUrl: string;
  sourceReference: string;
}>;

export type CreateStrategyDraftRecord = Readonly<{
  artifactType: StrategyArtifactType;
  artifactId?: string;
  name: string;
}>;

export type SaveStrategyDraftRecord = Readonly<{
  artifactType: StrategyArtifactType;
  versionId: string;
  name: string;
  content: readonly StrategyContentItem[];
}>;

export type ValidateStrategyVersionRecord = Readonly<{
  artifactType: StrategyArtifactType;
  versionId: string;
}>;

export interface StrategyRepository {
  findWorkspace(
    artifactType: StrategyArtifactType,
    context: RepositoryContext,
  ): Promise<StrategyWorkspace>;
  createEvidence(
    input: CreateStrategyEvidenceRecord,
    context: RepositoryContext,
  ): Promise<string>;
  createDraft(
    input: CreateStrategyDraftRecord,
    context: RepositoryContext,
  ): Promise<string>;
  saveDraft(
    input: SaveStrategyDraftRecord,
    context: RepositoryContext,
  ): Promise<string>;
  validateVersion(
    input: ValidateStrategyVersionRecord,
    context: RepositoryContext,
  ): Promise<string>;
}
