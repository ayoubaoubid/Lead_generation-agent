import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  OnboardingAnswer,
  OnboardingAnswerData,
  OnboardingHistoryEntry,
  OnboardingSession,
} from "@/domain/onboarding/onboarding";
import type {
  OnboardingRepository,
  SaveOnboardingStepRecord,
} from "@/repositories/contracts/onboarding.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";

type SessionRow = Database["public"]["Tables"]["onboarding_sessions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["onboarding_answers"]["Row"];
type HistoryRow =
  Database["public"]["Tables"]["onboarding_answer_history"]["Row"];
type HistoryListRow = Pick<
  HistoryRow,
  | "changed_at"
  | "changed_by"
  | "id"
  | "is_complete"
  | "revision"
  | "section_key"
>;

function requireClientContext(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped onboarding context required.",
    );
  }

  return context.tenant;
}

function mapAnswerData(value: Json): OnboardingAnswerData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RepositoryError(
      "unexpected_response",
      "Invalid onboarding answer payload.",
    );
  }

  return value as OnboardingAnswerData;
}

function mapAnswer(row: AnswerRow): OnboardingAnswer {
  return {
    id: row.id,
    sectionKey: row.section_key,
    data: mapAnswerData(row.answer_data),
    isComplete: row.is_complete,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

function mapHistory(row: HistoryListRow): OnboardingHistoryEntry {
  return {
    id: row.id,
    sectionKey: row.section_key,
    revision: row.revision,
    isComplete: row.is_complete,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

function mutationFailure(error: { code?: string; message: string }): never {
  const conflictCodes = new Set(["23514", "55000"]);
  throw new RepositoryError(
    error.code && conflictCodes.has(error.code) ? "conflict" : "unavailable",
    "Onboarding persistence failed.",
    error,
  );
}

export class SupabaseOnboardingRepository implements OnboardingRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async find(context: RepositoryContext): Promise<OnboardingSession> {
    const tenant = requireClientContext(context);
    const { data: session, error: sessionError } = await this.supabase
      .from("onboarding_sessions")
      .select("*")
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .maybeSingle();

    if (sessionError) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load onboarding.",
        sessionError,
      );
    }

    if (!session) {
      return {
        id: null,
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
        status: "draft",
        currentStep: 1,
        completedStepCount: 0,
        completedAt: null,
        validatedAt: null,
        validatedBy: null,
        updatedAt: null,
        answers: {},
        history: [],
      };
    }

    const [answersResult, historyResult] = await Promise.all([
      this.supabase
        .from("onboarding_answers")
        .select("*")
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("session_id", session.id)
        .order("section_key"),
      this.supabase
        .from("onboarding_answer_history")
        .select(
          "id, section_key, revision, is_complete, changed_by, changed_at",
        )
        .eq("agency_id", tenant.agencyId)
        .eq("client_id", tenant.clientId)
        .eq("session_id", session.id)
        .order("changed_at", { ascending: false })
        .limit(20),
    ]);

    if (answersResult.error || historyResult.error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load onboarding details.",
        answersResult.error ?? historyResult.error,
      );
    }

    const answers = Object.fromEntries(
      answersResult.data.map((row) => [row.section_key, mapAnswer(row)]),
    );

    return this.mapSession(
      session,
      answers,
      historyResult.data.map(mapHistory),
    );
  }

  async saveStep(
    input: SaveOnboardingStepRecord,
    context: RepositoryContext,
  ): Promise<string> {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc("save_onboarding_step", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_section_key: input.sectionKey,
      requested_answer_data: input.data as Json,
      requested_is_complete: input.isComplete,
      requested_current_step: input.currentStep,
    });

    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Onboarding save returned no identifier." },
      );
    }

    return data;
  }

  async complete(context: RepositoryContext): Promise<string> {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc(
      "complete_client_onboarding",
      {
        requested_agency_id: tenant.agencyId,
        requested_client_id: tenant.clientId,
      },
    );

    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Onboarding completion returned no identifier." },
      );
    }

    return data;
  }

  async validate(context: RepositoryContext): Promise<string> {
    const tenant = requireClientContext(context);
    const { data, error } = await this.supabase.rpc(
      "validate_client_onboarding",
      {
        requested_agency_id: tenant.agencyId,
        requested_client_id: tenant.clientId,
      },
    );

    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Onboarding validation returned no identifier." },
      );
    }

    return data;
  }

  private mapSession(
    row: SessionRow,
    answers: OnboardingSession["answers"],
    history: readonly OnboardingHistoryEntry[],
  ): OnboardingSession {
    return {
      id: row.id,
      agencyId: row.agency_id,
      clientId: row.client_id,
      status: row.status,
      currentStep: row.current_step,
      completedStepCount: row.completed_step_count,
      completedAt: row.completed_at,
      validatedAt: row.validated_at,
      validatedBy: row.validated_by,
      updatedAt: row.updated_at,
      answers,
      history,
    };
  }
}
