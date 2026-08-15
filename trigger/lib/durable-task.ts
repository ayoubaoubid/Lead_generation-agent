import { logger } from "@trigger.dev/sdk";

import type {
  Database,
  Json,
} from "../../apps/web/src/types/database.generated";
import type { DurableTaskPayload } from "./task-payload";
import {
  createTriggerSupabaseClient,
  type TriggerSupabaseClient,
} from "./supabase-worker";

type AsyncTaskErrorClass =
  Database["public"]["Enums"]["async_task_error_class"];

export type VerifiedTaskResource = Readonly<{
  agencyId: string;
  clientId: string;
  createdBy: string;
  resourceType: string;
}>;

export type DurableTaskResult = Readonly<{
  result: Readonly<Record<string, Json | undefined>>;
  costMicrousd?: number;
}>;

type ClaimResult = Readonly<{
  taskRunId: string;
  shouldExecute: boolean;
  attemptCount: number;
  result?: Readonly<Record<string, Json | undefined>>;
}>;

type ExecuteDurableTaskOptions = Readonly<{
  taskId: string;
  triggerRunId: string;
  payload: DurableTaskPayload;
  loadResource: (
    client: TriggerSupabaseClient,
    resourceId: string,
  ) => Promise<VerifiedTaskResource>;
  execute: (
    client: TriggerSupabaseClient,
    payload: DurableTaskPayload,
  ) => Promise<DurableTaskResult>;
}>;

export class DurableTaskError extends Error {
  readonly errorClass: AsyncTaskErrorClass;
  readonly code: string;

  constructor(
    code: string,
    errorClass: AsyncTaskErrorClass,
    safeMessage: string,
  ) {
    super(safeMessage);
    this.name = "DurableTaskError";
    this.code = code;
    this.errorClass = errorClass;
  }
}

export function durableTaskCatchError({
  error,
}: Readonly<{ error: unknown }>): Readonly<{ skipRetrying: boolean }> | void {
  if (error instanceof DurableTaskError && error.errorClass !== "retryable") {
    return { skipRetrying: true };
  }
}

function parseClaimResult(value: Json): ClaimResult {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new DurableTaskError(
      "TASK_CLAIM_INVALID",
      "intervention_required",
      "Le registre d’exécution a retourné une réponse invalide.",
    );
  }

  const taskRunId = value.taskRunId;
  const shouldExecute = value.shouldExecute;
  const attemptCount = value.attemptCount;
  if (
    typeof taskRunId !== "string" ||
    typeof shouldExecute !== "boolean" ||
    typeof attemptCount !== "number"
  ) {
    throw new DurableTaskError(
      "TASK_CLAIM_INVALID",
      "intervention_required",
      "Le registre d’exécution a retourné une réponse invalide.",
    );
  }

  const result =
    value.result &&
    !Array.isArray(value.result) &&
    typeof value.result === "object"
      ? value.result
      : undefined;

  return {
    taskRunId,
    shouldExecute,
    attemptCount,
    ...(result ? { result } : {}),
  };
}

function classifyFailure(error: unknown): {
  errorClass: AsyncTaskErrorClass;
  code: string;
  safeMessage: string;
} {
  if (error instanceof DurableTaskError) {
    return {
      errorClass: error.errorClass,
      code: error.code,
      safeMessage: error.message,
    };
  }

  return {
    errorClass: "retryable",
    code: "TASK_EXECUTION_FAILED",
    safeMessage: "Le traitement asynchrone a échoué.",
  };
}

async function verifyActorMembership(
  client: TriggerSupabaseClient,
  payload: DurableTaskPayload,
  fallbackActorId: string,
): Promise<string> {
  const actorId = payload.actorId ?? fallbackActorId;
  const agencyMembership = await client
    .from("agency_members")
    .select("id,role_id")
    .eq("agency_id", payload.agencyId)
    .eq("profile_id", actorId)
    .eq("status", "active")
    .maybeSingle();
  if (agencyMembership.error) throw agencyMembership.error;
  if (!agencyMembership.data) {
    throw new DurableTaskError(
      "TASK_ACTOR_UNAUTHORIZED",
      "permanent",
      "L’acteur n’est plus membre actif de l’agence.",
    );
  }

  const agencyRole = await client
    .from("roles")
    .select("slug,scope")
    .eq("id", agencyMembership.data.role_id)
    .eq("agency_id", payload.agencyId)
    .is("archived_at", null)
    .single();
  if (agencyRole.error) throw agencyRole.error;
  if (agencyRole.data.scope === "agency" && agencyRole.data.slug === "owner") {
    return actorId;
  }

  const clientMembership = await client
    .from("client_members")
    .select("id")
    .eq("agency_id", payload.agencyId)
    .eq("client_id", payload.clientId)
    .eq("profile_id", actorId)
    .eq("status", "active")
    .maybeSingle();
  if (clientMembership.error) throw clientMembership.error;
  if (!clientMembership.data) {
    throw new DurableTaskError(
      "TASK_ACTOR_UNAUTHORIZED",
      "permanent",
      "L’acteur n’est plus affecté au client.",
    );
  }

  return actorId;
}

export async function executeDurableTask({
  taskId,
  triggerRunId,
  payload,
  loadResource,
  execute,
}: ExecuteDurableTaskOptions): Promise<
  Readonly<Record<string, Json | undefined>>
> {
  const client = createTriggerSupabaseClient();
  const resource = await loadResource(client, payload.resourceId);

  if (
    resource.agencyId !== payload.agencyId ||
    resource.clientId !== payload.clientId
  ) {
    throw new DurableTaskError(
      "TASK_TENANT_MISMATCH",
      "permanent",
      "La ressource n’appartient pas au tenant demandé.",
    );
  }

  const actorId = await verifyActorMembership(
    client,
    payload,
    resource.createdBy,
  );
  const claimResponse = await client.rpc("claim_async_task_run", {
    requested_actor_id: actorId,
    requested_agency_id: resource.agencyId,
    requested_client_id: resource.clientId,
    requested_idempotency_key: payload.idempotencyKey,
    requested_resource_id: payload.resourceId,
    requested_resource_type: resource.resourceType,
    requested_task_id: taskId,
    requested_trigger_run_id: triggerRunId,
  });
  if (claimResponse.error) throw claimResponse.error;

  const claim = parseClaimResult(claimResponse.data);
  logger.info("Durable task claimed", {
    taskId,
    taskRunId: claim.taskRunId,
    triggerRunId,
    agencyId: resource.agencyId,
    clientId: resource.clientId,
    attempt: claim.attemptCount,
    shouldExecute: claim.shouldExecute,
  });

  if (!claim.shouldExecute) {
    logger.info("Durable task effect already completed", {
      taskId,
      taskRunId: claim.taskRunId,
      triggerRunId,
    });
    return claim.result ?? {};
  }

  try {
    const output = await execute(client, payload);
    const completion = await client.rpc("complete_async_task_run", {
      requested_task_run_id: claim.taskRunId,
      requested_result: output.result,
      requested_cost_microusd: output.costMicrousd ?? 0,
    });
    if (completion.error) throw completion.error;
    return output.result;
  } catch (error) {
    const failure = classifyFailure(error);
    const failed = await client.rpc("fail_async_task_run", {
      requested_task_run_id: claim.taskRunId,
      requested_error_class: failure.errorClass,
      requested_error_code: failure.code,
      requested_error_message_redacted: failure.safeMessage,
    });

    if (failed.error) {
      logger.error("Durable task failure could not be persisted", {
        taskId,
        taskRunId: claim.taskRunId,
        triggerRunId,
        code: "TASK_FAILURE_PERSISTENCE_FAILED",
      });
    }

    logger.error("Durable task failed", {
      taskId,
      taskRunId: claim.taskRunId,
      triggerRunId,
      errorClass: failure.errorClass,
      code: failure.code,
    });
    throw error;
  }
}
