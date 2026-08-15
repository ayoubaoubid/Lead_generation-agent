import { describe, expect, it } from "vitest";

import {
  applyImportMapping,
  prepareDataImportSchema,
} from "@/validations/imports/data-import.schema";

const base = {
  entityType: "company" as const,
  fileName: "companies.csv",
  mimeType: "text/csv" as const,
  fileSizeBytes: 100,
  fileSha256: null,
  delimiter: "," as const,
  estimatedRowCount: 2,
};

describe("prepareDataImportSchema", () => {
  it("requires a deterministic identity field for a company import", () => {
    const result = prepareDataImportSchema.safeParse({
      ...base,
      columnMapping: { industry: "sector" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects reusing one CSV column for two canonical fields", () => {
    const result = prepareDataImportSchema.safeParse({
      ...base,
      columnMapping: { name: "company", domain: "company" },
    });

    expect(result.success).toBe(false);
  });

  it("maps only explicitly selected columns", () => {
    expect(
      applyImportMapping(
        { Company: "Acme", Ignore: "secret" },
        { name: "Company" },
      ),
    ).toEqual({ name: "Acme" });
  });
});
