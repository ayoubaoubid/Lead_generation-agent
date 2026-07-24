import type {
  AiAgentId,
  CommercialSkillId,
} from "@/domain/ai/commercial-skill";
import {
  AiExecutionError,
  type AiExecutionResult,
  type AiModelProfile,
} from "@/domain/ai/ai-execution";
import type {
  AiExecutionTrace,
  AiExecutionTraceRepository,
} from "@/repositories/contracts/ai-execution-trace.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import {
  agentCanUseSkill,
  aiAgentRegistry,
} from "@/services/ai/agent-registry";
import type { AiCostCalculator } from "@/services/ai/ai-cost-calculator";
import type { AiExecutionAuthorizer } from "@/services/ai/ai-execution-authorizer";
import {
  AiModelProviderError,
  type AiModelProvider,
} from "@/services/ai/ai-model-provider";
import {
  commercialSkillRegistry,
  type SkillDefinition,
} from "@/services/ai/commercial-skill-registry";
import type { PromptRepository } from "@/services/ai/prompt-repository";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";
import {
  aiProviderResponseSchema,
  aiTechnicalCostSchema,
} from "@/validations/ai/ai-execution.schema";

export type ExecuteCommercialSkillCommand = Readonly<{
  agentId: AiAgentId;
  skillId: CommercialSkillId;
  input: unknown;
  modelProfile?: AiModelProfile;
}>;

type SkillExecutionDependencies = Readonly<{
  modelProvider: AiModelProvider;
  costCalculator: AiCostCalculator;
  promptRepository: PromptRepository;
  traceRepository: AiExecutionTraceRepository;
  authorizer: AiExecutionAuthorizer;
  createExecutionId: () => string;
  createDataReference: (value: unknown) => string;
  now: () => Date;
  sleep: (durationMs: number) => Promise<void>;
}>;

function repositoryContext(context: ServiceContext): RepositoryContext {
  return {
    tenant: context.tenant,
    correlationId: context.correlationId,
  };
}

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new AiExecutionError(
      "agent_not_allowed",
      "AI skills require a verified client tenant context.",
      false,
    );
  }
}

function resolveModelProfile(
  requestedProfile: AiModelProfile | undefined,
  skill: SkillDefinition,
): AiModelProfile {
  const profile = requestedProfile ?? skill.defaultModelProfile;
  if (!skill.allowedModelProfiles.includes(profile)) {
    throw new AiExecutionError(
      "agent_not_allowed",
      "The requested model profile is not allowed for this skill.",
      false,
    );
  }
  return profile;
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      reject(
        new AiExecutionError(
          "timed_out",
          "The AI execution exceeded its time limit.",
          true,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function failureCode(error: unknown): string {
  if (error instanceof AiExecutionError) return error.code;
  if (error instanceof AiModelProviderError) {
    return error.providerCode ?? "provider_failed";
  }
  return "provider_failed";
}

function isRetryable(error: unknown): boolean {
  return (
    (error instanceof AiExecutionError && error.retryable) ||
    (error instanceof AiModelProviderError && error.retryable)
  );
}

export class SkillExecutionService {
  constructor(private readonly dependencies: SkillExecutionDependencies) {}

  async execute(
    command: ExecuteCommercialSkillCommand,
    context: ServiceContext,
  ): Promise<AiExecutionResult> {
    assertClientScope(context);

    const skill = commercialSkillRegistry[command.skillId];
    const agent = aiAgentRegistry[command.agentId];
    if (!skill) {
      throw new AiExecutionError(
        "skill_not_found",
        "The requested skill is not registered.",
        false,
      );
    }
    if (!agentCanUseSkill(command.agentId, command.skillId)) {
      throw new AiExecutionError(
        "agent_not_allowed",
        "This agent is not allowed to use the requested skill.",
        false,
      );
    }

    await this.dependencies.authorizer.assertCanExecute(
      { agentId: command.agentId, skillId: command.skillId },
      context,
    );

    const parsedInput = skill.inputSchema.safeParse(command.input);
    if (!parsedInput.success) {
      throw new AiExecutionError(
        "input_invalid",
        "The structured skill input is invalid.",
        false,
        parsedInput.error,
      );
    }

    const modelProfile = resolveModelProfile(command.modelProfile, skill);
    const executionId = this.dependencies.createExecutionId();
    const queuedAt = this.dependencies.now().toISOString();
    const traceContext = repositoryContext(context);
    let trace: AiExecutionTrace = {
      executionId,
      correlationId: context.correlationId,
      agentId: agent.id,
      agentVersion: agent.version,
      skillId: skill.id,
      skillVersion: skill.version,
      promptVersion: skill.promptVersion,
      modelProfile,
      modelId: null,
      status: "queued",
      attempt: 0,
      inputReference: this.dependencies.createDataReference(parsedInput.data),
      outputReference: null,
      usage: null,
      technicalCost: null,
      errorCode: null,
      startedAt: null,
      completedAt: null,
    };

    await this.dependencies.traceRepository.create(trace, traceContext);

    let systemPrompt: string;
    try {
      systemPrompt = await this.dependencies.promptRepository.load({
        skillId: skill.id,
        skillVersion: skill.version,
        promptVersion: skill.promptVersion,
        path: skill.promptPath,
      });
    } catch (error) {
      trace = {
        ...trace,
        status: "failed",
        errorCode: "provider_failed",
        completedAt: this.dependencies.now().toISOString(),
      };
      await this.dependencies.traceRepository.update(trace, traceContext);
      throw new AiExecutionError(
        "provider_failed",
        "The versioned prompt could not be loaded.",
        false,
        error,
      );
    }

    const startedAt = this.dependencies.now().toISOString();
    for (let attempt = 1; attempt <= skill.limits.maxAttempts; attempt += 1) {
      trace = {
        ...trace,
        status: attempt === 1 ? "running" : "retrying",
        attempt,
        startedAt,
      };
      await this.dependencies.traceRepository.update(trace, traceContext);

      try {
        const rawResponse = await withTimeout(
          (signal) =>
            this.dependencies.modelProvider.generateStructured({
              executionId,
              systemPrompt,
              input: parsedInput.data,
              modelProfile,
              maxInputTokens: skill.limits.maxInputTokens,
              maxOutputTokens: skill.limits.maxOutputTokens,
              signal,
            }),
          skill.limits.timeoutMs,
        );
        const response = aiProviderResponseSchema.safeParse(rawResponse);
        if (!response.success) {
          throw new AiExecutionError(
            "output_invalid",
            "The model provider returned an invalid execution envelope.",
            false,
            response.error,
          );
        }

        const parsedOutput = skill.outputSchema.safeParse(response.data.output);
        if (!parsedOutput.success) {
          throw new AiExecutionError(
            "output_invalid",
            "The structured skill output is invalid.",
            false,
            parsedOutput.error,
          );
        }

        const technicalCostResult = aiTechnicalCostSchema.safeParse(
          this.dependencies.costCalculator.calculate({
            modelId: response.data.modelId,
            usage: response.data.usage,
          }),
        );
        if (!technicalCostResult.success) {
          throw new AiExecutionError(
            "output_invalid",
            "The technical cost calculation is invalid.",
            false,
            technicalCostResult.error,
          );
        }
        const technicalCost = technicalCostResult.data;
        const completedAt = this.dependencies.now().toISOString();
        trace = {
          ...trace,
          status: "succeeded",
          modelId: response.data.modelId,
          outputReference: this.dependencies.createDataReference(
            parsedOutput.data,
          ),
          usage: response.data.usage,
          technicalCost,
          errorCode: null,
          completedAt,
        };
        await this.dependencies.traceRepository.update(trace, traceContext);
        context.logger.info("Structured AI skill execution succeeded.", {
          operation: "ai.skill.execute",
          correlationId: context.correlationId,
          agencyId: context.tenant.agencyId,
          clientId: context.tenant.clientId,
          resourceType: "ai_execution",
          resourceId: executionId,
          attributes: {
            agentId: agent.id,
            skillId: skill.id,
            skillVersion: skill.version,
            promptVersion: skill.promptVersion,
            modelId: response.data.modelId,
            attempts: attempt,
            totalTokens: response.data.usage.totalTokens,
            costMicrousd: technicalCost.amountMicrousd,
          },
        });

        return {
          executionId,
          status: "succeeded",
          agentId: agent.id,
          agentVersion: agent.version,
          skillId: skill.id,
          skillVersion: skill.version,
          promptVersion: skill.promptVersion,
          modelId: response.data.modelId,
          modelProfile,
          output: parsedOutput.data,
          usage: response.data.usage,
          technicalCost,
          attempts: attempt,
          startedAt,
          completedAt,
        };
      } catch (error) {
        const canRetry =
          isRetryable(error) && attempt < skill.limits.maxAttempts;
        if (canRetry) {
          await this.dependencies.sleep(skill.limits.retryBackoffMs * attempt);
          continue;
        }

        const completedAt = this.dependencies.now().toISOString();
        trace = {
          ...trace,
          status:
            error instanceof AiExecutionError && error.code === "timed_out"
              ? "timed_out"
              : "failed",
          errorCode: failureCode(error),
          completedAt,
        };
        await this.dependencies.traceRepository.update(trace, traceContext);
        context.logger.error(
          "Structured AI skill execution failed.",
          {
            name: error instanceof Error ? error.name : "UnknownError",
            code: failureCode(error),
            message: "AI execution failed without logging prompt or payload.",
          },
          {
            operation: "ai.skill.execute",
            correlationId: context.correlationId,
            agencyId: context.tenant.agencyId,
            clientId: context.tenant.clientId,
            resourceType: "ai_execution",
            resourceId: executionId,
            attributes: {
              agentId: agent.id,
              skillId: skill.id,
              attempt,
            },
          },
        );

        if (error instanceof AiExecutionError) throw error;
        if (error instanceof AiModelProviderError) {
          throw new AiExecutionError(
            "provider_failed",
            "The AI provider failed.",
            false,
            error,
          );
        }
        throw new AiExecutionError(
          "provider_failed",
          "The AI execution failed unexpectedly.",
          false,
          error,
        );
      }
    }

    throw new AiExecutionError(
      "provider_failed",
      `AI execution ${executionId} ended without a terminal result at ${queuedAt}.`,
      false,
    );
  }
}
