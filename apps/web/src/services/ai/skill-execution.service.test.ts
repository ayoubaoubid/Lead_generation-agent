import { describe, expect, it, vi } from "vitest";

import type {
  AiExecutionTrace,
  AiExecutionTraceRepository,
} from "@/repositories/contracts/ai-execution-trace.repository";
import type { Logger } from "@/lib/logging/logger";
import { AiModelProviderError } from "@/services/ai/ai-model-provider";
import { SkillExecutionService } from "@/services/ai/skill-execution.service";
import type { ServiceContext } from "@/services/service-context";

const validDiagnoseInput = {
  objective: "Comprendre pourquoi le taux de réponse a baissé.",
  knownStatements: [
    {
      statement: "Le taux de rebond observé est de 8 %.",
      classification: "confirmed_fact",
      confidence: 1,
      sourceReferenceIds: ["analytics-1"],
    },
  ],
  evidenceReferences: [
    {
      referenceId: "analytics-1",
      label: "Rapport de campagne",
      url: null,
    },
  ],
  constraints: ["Ne pas modifier la campagne automatiquement."],
  observedMetrics: { bounceRate: 0.08 },
  observedIncidents: [],
  currentStage: "analysis",
};

const validDiagnoseOutput = {
  diagnosis: "Le rebond élevé peut dégrader la performance.",
  probableCauses: [
    {
      cause: "Une partie des adresses peut être invalide.",
      category: "deliverability",
      confidence: 0.8,
    },
  ],
  confidence: 0.8,
  recommendedSkill: null,
  recommendedActions: ["Vérifier les adresses avant tout nouvel envoi."],
  requiredEvidence: ["Résultats du fournisseur de vérification."],
  grounding: {
    statements: [
      {
        statement: "Le taux de rebond observé est de 8 %.",
        classification: "confirmed_fact",
        confidence: 1,
        sourceReferenceIds: ["analytics-1"],
      },
      {
        statement: "Des adresses invalides peuvent contribuer au rebond.",
        classification: "hypothesis",
        confidence: 0.8,
        sourceReferenceIds: [],
      },
    ],
    missingEvidence: ["Résultats de vérification des adresses."],
  },
};

function createHarness() {
  const traces: AiExecutionTrace[] = [];
  const traceRepository: AiExecutionTraceRepository = {
    create: vi.fn(async (trace) => {
      traces.push(trace);
    }),
    update: vi.fn(async (trace) => {
      traces.push(trace);
    }),
  };
  const logger: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const context: ServiceContext = {
    tenant: {
      scope: "client",
      agencyId: "agency-a",
      clientId: "client-a",
      actor: { kind: "user", actorId: "user-a" },
    },
    correlationId: "correlation-a",
    logger,
  };

  return { context, logger, traceRepository, traces };
}

describe("SkillExecutionService", () => {
  it("validates, retries and traces a structured execution without logging payloads", async () => {
    const harness = createHarness();
    const generateStructured = vi
      .fn()
      .mockRejectedValueOnce(
        new AiModelProviderError(
          "temporary provider error",
          true,
          "rate_limit",
        ),
      )
      .mockResolvedValueOnce({
        modelId: "provider-model-v1",
        output: validDiagnoseOutput,
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
      });

    const service = new SkillExecutionService({
      modelProvider: { generateStructured },
      costCalculator: {
        calculate: () => ({
          amountMicrousd: 1400,
          currency: "USD",
          pricingVersion: "provider-pricing-2026-01",
        }),
      },
      promptRepository: {
        load: vi.fn(async () => "Versioned system prompt"),
      },
      traceRepository: harness.traceRepository,
      authorizer: { assertCanExecute: vi.fn(async () => undefined) },
      createExecutionId: () => "execution-a",
      createDataReference: (value) =>
        value === validDiagnoseInput ? "input-ref" : "structured-ref",
      now: () => new Date("2026-07-24T00:00:00.000Z"),
      sleep: vi.fn(async () => undefined),
    });

    const result = await service.execute(
      {
        agentId: "analytics-agent",
        skillId: "diagnose",
        input: validDiagnoseInput,
      },
      harness.context,
    );

    expect(result).toMatchObject({
      executionId: "execution-a",
      status: "succeeded",
      skillVersion: "1.0.0",
      promptVersion: "1",
      modelId: "provider-model-v1",
      attempts: 2,
    });
    expect(generateStructured).toHaveBeenCalledTimes(2);
    expect(harness.traces.map((trace) => trace.status)).toEqual([
      "queued",
      "running",
      "retrying",
      "succeeded",
    ]);
    expect(harness.logger.info).toHaveBeenCalledWith(
      "Structured AI skill execution succeeded.",
      expect.not.objectContaining({
        input: expect.anything(),
        output: expect.anything(),
        systemPrompt: expect.anything(),
      }),
    );
  });

  it("rejects invalid structured input before creating an execution trace", async () => {
    const harness = createHarness();
    const service = new SkillExecutionService({
      modelProvider: {
        generateStructured: vi.fn(),
      },
      costCalculator: {
        calculate: vi.fn(),
      },
      promptRepository: { load: vi.fn() },
      traceRepository: harness.traceRepository,
      authorizer: { assertCanExecute: vi.fn(async () => undefined) },
      createExecutionId: () => "execution-a",
      createDataReference: () => "reference",
      now: () => new Date("2026-07-24T00:00:00.000Z"),
      sleep: vi.fn(async () => undefined),
    });

    await expect(
      service.execute(
        {
          agentId: "analytics-agent",
          skillId: "diagnose",
          input: { objective: "" },
        },
        harness.context,
      ),
    ).rejects.toMatchObject({
      code: "input_invalid",
    });
    expect(harness.traceRepository.create).not.toHaveBeenCalled();
  });

  it("prevents an agent from invoking a skill outside its allowlist", async () => {
    const harness = createHarness();
    const service = new SkillExecutionService({
      modelProvider: { generateStructured: vi.fn() },
      costCalculator: {
        calculate: vi.fn(),
      },
      promptRepository: { load: vi.fn() },
      traceRepository: harness.traceRepository,
      authorizer: { assertCanExecute: vi.fn(async () => undefined) },
      createExecutionId: () => "execution-a",
      createDataReference: () => "reference",
      now: () => new Date("2026-07-24T00:00:00.000Z"),
      sleep: vi.fn(async () => undefined),
    });

    await expect(
      service.execute(
        {
          agentId: "message-quality-agent",
          skillId: "diagnose",
          input: validDiagnoseInput,
        },
        harness.context,
      ),
    ).rejects.toMatchObject({
      code: "agent_not_allowed",
    });
  });
});
