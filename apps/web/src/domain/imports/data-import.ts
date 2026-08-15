export const dataImportEntityTypes = ["company", "contact"] as const;
export type DataImportEntityType = (typeof dataImportEntityTypes)[number];

export const dataImportStatuses = [
  "draft",
  "ready",
  "queued",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancel_requested",
  "cancelled",
] as const;
export type DataImportStatus = (typeof dataImportStatuses)[number];

export const dataImportRowStatuses = [
  "pending",
  "created",
  "duplicate",
  "invalid",
  "failed",
  "cancelled",
] as const;
export type DataImportRowStatus = (typeof dataImportRowStatuses)[number];

export type DataImport = Readonly<{
  id: string;
  entityType: DataImportEntityType;
  status: DataImportStatus;
  fileName: string;
  fileSizeBytes: number;
  estimatedRowCount: number | null;
  processedRowCount: number;
  createdRowCount: number;
  duplicateRowCount: number;
  invalidRowCount: number;
  failedRowCount: number;
  triggerRunId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}>;

export type DataImportRow = Readonly<{
  id: number;
  rowNumber: number;
  status: DataImportRowStatus;
  duplicateReason: string | null;
  errorCodes: readonly string[];
  errorMessage: string | null;
  companyId: string | null;
  contactId: string | null;
  processedAt: string | null;
}>;

export type PreparedDataImport = Readonly<{
  id: string;
  storagePath: string;
}>;
