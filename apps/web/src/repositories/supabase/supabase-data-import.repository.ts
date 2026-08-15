import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { DataImport, DataImportRow } from "@/domain/imports/data-import";
import type { DataImportRepository } from "@/repositories/contracts/data-import.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { RepositoryError } from "@/repositories/repository-error";
import type { Database, Json } from "@/types/database.generated";

const preparedResultSchema = z.object({
  id: z.uuid(),
  storagePath: z.string().min(1),
});

function clientTenant(context: RepositoryContext) {
  if (context.tenant.scope !== "client") {
    throw new RepositoryError(
      "unexpected_response",
      "Client-scoped import context required.",
    );
  }
  return context.tenant;
}

function mutationFailure(error: { code?: string; message: string }): never {
  throw new RepositoryError(
    error.code && ["23505", "23514", "42501", "55000"].includes(error.code)
      ? "conflict"
      : error.code === "P0002"
        ? "not_found"
        : "unavailable",
    "Import persistence failed.",
    error,
  );
}

export class SupabaseDataImportRepository implements DataImportRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(context: RepositoryContext) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("data_imports")
      .select("*")
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load imports.",
        error,
      );
    }
    return data.map((row): DataImport => ({
      id: row.id,
      entityType: row.entity_type,
      status: row.status,
      fileName: row.file_name,
      fileSizeBytes: row.file_size_bytes,
      estimatedRowCount: row.estimated_row_count,
      processedRowCount: row.processed_row_count,
      createdRowCount: row.created_row_count,
      duplicateRowCount: row.duplicate_row_count,
      invalidRowCount: row.invalid_row_count,
      failedRowCount: row.failed_row_count,
      triggerRunId: row.trigger_run_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    }));
  }

  async listRows(importId: string, context: RepositoryContext) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase
      .from("data_import_rows")
      .select("*")
      .eq("agency_id", tenant.agencyId)
      .eq("client_id", tenant.clientId)
      .eq("import_id", importId)
      .order("row_number", { ascending: true })
      .limit(1000);
    if (error) {
      throw new RepositoryError(
        "unavailable",
        "Unable to load import rows.",
        error,
      );
    }
    return data.map((row): DataImportRow => ({
      id: row.id,
      rowNumber: row.row_number,
      status: row.status,
      duplicateReason: row.duplicate_reason,
      errorCodes: row.error_codes,
      errorMessage: row.error_message,
      companyId: row.company_id,
      contactId: row.contact_id,
      processedAt: row.processed_at,
    }));
  }

  async prepare(
    input: Parameters<DataImportRepository["prepare"]>[0],
    context: RepositoryContext,
  ) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase.rpc("prepare_data_import", {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_entity_type: input.entityType,
      requested_file_name: input.fileName,
      requested_mime_type: input.mimeType,
      requested_file_size_bytes: input.fileSizeBytes,
      requested_file_sha256: input.fileSha256 ?? "",
      requested_delimiter: input.delimiter,
      requested_column_mapping: input.columnMapping as Json,
      requested_estimated_row_count: input.estimatedRowCount,
    });
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Import preparation returned no result." },
      );
    }
    const parsed = preparedResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new RepositoryError(
        "unexpected_response",
        "Import preparation returned an invalid result.",
        parsed.error,
      );
    }
    return parsed.data;
  }

  async markReady(importId: string, context: RepositoryContext) {
    return this.uuidMutation("mark_data_import_ready", importId, context, {});
  }

  async setTriggerRun(
    importId: string,
    triggerRunId: string,
    context: RepositoryContext,
  ) {
    return this.uuidMutation("set_data_import_trigger_run", importId, context, {
      requested_trigger_run_id: triggerRunId,
    });
  }

  async requestCancellation(importId: string, context: RepositoryContext) {
    return this.uuidMutation(
      "request_data_import_cancellation",
      importId,
      context,
      {},
    );
  }

  private async uuidMutation(
    functionName:
      | "mark_data_import_ready"
      | "set_data_import_trigger_run"
      | "request_data_import_cancellation",
    importId: string,
    context: RepositoryContext,
    additional: Readonly<Record<string, string>>,
  ) {
    const tenant = clientTenant(context);
    const { data, error } = await this.supabase.rpc(functionName, {
      requested_agency_id: tenant.agencyId,
      requested_client_id: tenant.clientId,
      requested_import_id: importId,
      ...additional,
    } as never);
    if (error || !data) {
      return mutationFailure(
        error ?? { message: "Import mutation returned no id." },
      );
    }
    return data;
  }
}
