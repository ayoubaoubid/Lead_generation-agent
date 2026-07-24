import type {
  AiExecutionStatus,
  AiModelProfile,
  AiTechnicalCost,
  AiTokenUsage,
} from "@/domain/ai/ai-execution";
import type { RepositoryContext } from "@/repositories/repository-context";

export type AiExecutionTrace = Readonly<{
  executionId: string;
  correlationId: string;
  agentId: string;
  agentVersion: string;
  skillId: string;
  skillVersion: string;
  promptVersion: string;
  modelProfile: AiModelProfile;
  modelId: string | null;
  status: AiExecutionStatus;
  attempt: number;
  inputReference: string;
  outputReference: string | null;
  usage: AiTokenUsage | null;
  technicalCost: AiTechnicalCost | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
}>;

export interface AiExecutionTraceRepository {
  create(trace: AiExecutionTrace, context: RepositoryContext): Promise<void>;
  update(trace: AiExecutionTrace, context: RepositoryContext): Promise<void>;
}
