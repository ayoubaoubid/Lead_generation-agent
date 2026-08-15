import type {
  DataImport,
  DataImportRow,
  PreparedDataImport,
} from "@/domain/imports/data-import";
import type { RepositoryContext } from "@/repositories/repository-context";
import type { PrepareDataImportInput } from "@/validations/imports/data-import.schema";

export interface DataImportRepository {
  list(context: RepositoryContext): Promise<readonly DataImport[]>;
  listRows(
    importId: string,
    context: RepositoryContext,
  ): Promise<readonly DataImportRow[]>;
  prepare(
    input: PrepareDataImportInput,
    context: RepositoryContext,
  ): Promise<PreparedDataImport>;
  markReady(importId: string, context: RepositoryContext): Promise<string>;
  setTriggerRun(
    importId: string,
    triggerRunId: string,
    context: RepositoryContext,
  ): Promise<string>;
  requestCancellation(
    importId: string,
    context: RepositoryContext,
  ): Promise<string>;
}
