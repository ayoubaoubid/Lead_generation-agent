import { logger, schemaTask } from "@trigger.dev/sdk";

import { parseCsv } from "../../apps/web/src/lib/csv/csv-parser";
import type {
  Database,
  Json,
} from "../../apps/web/src/types/database.generated";
import {
  executeDurableTask,
  type VerifiedTaskResource,
} from "../lib/durable-task";
import {
  durableTaskPayloadSchema,
  triggerRetryPolicy,
} from "../lib/task-payload";
import {
  createTriggerSupabaseClient,
  type TriggerSupabaseClient,
} from "../lib/supabase-worker";

const BATCH_SIZE = 100;
const factStatuses = new Set([
  "confirmed",
  "extracted",
  "estimated",
  "hypothesis",
  "unverified",
]);

type ImportRow = Database["public"]["Tables"]["data_imports"]["Row"];
type RawCsvRow = Readonly<Record<string, string>>;
type Mapping = Readonly<Record<string, string>>;

function normalizeName(value: string | null | undefined): string | null {
  const normalized = value
    ?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return normalized || null;
}

function normalizeDomain(value: string | null | undefined): string | null {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/#:?].*$/, "");
  return normalized || null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ? normalized
    : null;
}

function normalizeLinkedin(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.toLowerCase().endsWith("linkedin.com")) return null;
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return null;
  }
}

function optionalText(value: string | undefined): string | null {
  return value?.trim() || null;
}

function optionalNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function confidence(value: string | undefined): number | null {
  const parsed = optionalNumber(value);
  return parsed !== null && Number.isInteger(parsed) && parsed <= 100
    ? parsed
    : null;
}

function factStatus(value: string | undefined) {
  return factStatuses.has(value?.trim() ?? "")
    ? (value?.trim() as Database["public"]["Enums"]["data_fact_status"])
    : ("extracted" as const);
}

function collectedAt(value: string | undefined, fallback: string): string {
  if (!value?.trim()) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? fallback : date.toISOString();
}

function applyMapping(row: RawCsvRow, mapping: Mapping) {
  return Object.fromEntries(
    Object.entries(mapping).map(([field, header]) => [
      field,
      row[header] ?? "",
    ]),
  );
}

async function findCompanyByExternalId(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  provider: string | null,
  externalId: string | null,
) {
  if (!provider || !externalId) return null;
  const { data, error } = await supabase
    .from("company_sources")
    .select("company_id")
    .eq("agency_id", dataImport.agency_id)
    .eq("client_id", dataImport.client_id)
    .ilike("provider", provider)
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw error;
  return data?.company_id ?? null;
}

async function findContactByExternalId(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  provider: string | null,
  externalId: string | null,
) {
  if (!provider || !externalId) return null;
  const { data, error } = await supabase
    .from("contact_sources")
    .select("contact_id")
    .eq("agency_id", dataImport.agency_id)
    .eq("client_id", dataImport.client_id)
    .ilike("provider", provider)
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw error;
  return data?.contact_id ?? null;
}

async function recordCompanySource(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  companyId: string,
  normalized: Record<string, string>,
  rowNumber: number,
) {
  const provider = optionalText(normalized.sourceProvider);
  const externalId = optionalText(normalized.externalId);
  const { error } = await supabase.from("company_sources").insert({
    agency_id: dataImport.agency_id,
    client_id: dataImport.client_id,
    company_id: companyId,
    source_type: "csv",
    provider: provider ?? "csv",
    external_id: externalId,
    source_url: optionalText(normalized.sourceUrl),
    collected_at: collectedAt(normalized.collectedAt, dataImport.created_at),
    fact_status: factStatus(normalized.factStatus),
    confidence_score: confidence(normalized.confidenceScore),
    verification_status: "unverified",
    metadata: {
      importId: dataImport.id,
      rowNumber,
    },
    created_by: dataImport.created_by,
  });
  if (error?.code !== "23505") throw error;
}

async function recordContactSource(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  contactId: string,
  normalized: Record<string, string>,
  rowNumber: number,
) {
  const provider = optionalText(normalized.sourceProvider);
  const externalId = optionalText(normalized.externalId);
  const { error } = await supabase.from("contact_sources").insert({
    agency_id: dataImport.agency_id,
    client_id: dataImport.client_id,
    contact_id: contactId,
    source_type: "csv",
    provider: provider ?? "csv",
    external_id: externalId,
    source_url: optionalText(normalized.sourceUrl),
    collected_at: collectedAt(normalized.collectedAt, dataImport.created_at),
    fact_status: factStatus(normalized.factStatus),
    confidence_score: confidence(normalized.confidenceScore),
    verification_status: "unverified",
    metadata: {
      importId: dataImport.id,
      rowNumber,
    },
    created_by: dataImport.created_by,
  });
  if (error?.code !== "23505") throw error;
}

async function ingestCompany(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  normalized: Record<string, string>,
  rowNumber: number,
) {
  const name = optionalText(normalized.name);
  const domain = normalizeDomain(normalized.domain);
  const normalizedName = normalizeName(name ?? domain);
  if (!normalizedName) {
    return {
      status: "invalid" as const,
      errorCodes: ["COMPANY_IDENTITY_MISSING"],
      errorMessage: "Nom ou domaine manquant.",
    };
  }
  const provider = optionalText(normalized.sourceProvider);
  const externalId = optionalText(normalized.externalId);

  const imported = await supabase
    .from("companies")
    .select("id")
    .eq("source_import_id", dataImport.id)
    .eq("source_import_row_number", rowNumber)
    .maybeSingle();
  if (imported.error) throw imported.error;
  if (imported.data) {
    return {
      status: "created" as const,
      companyId: imported.data.id,
      duplicateReason: null,
    };
  }

  let duplicateId = await findCompanyByExternalId(
    supabase,
    dataImport,
    provider,
    externalId,
  );
  let duplicateReason = duplicateId ? "external_identifier" : null;
  if (!duplicateId && domain) {
    const byDomain = await supabase
      .from("companies")
      .select("id")
      .eq("agency_id", dataImport.agency_id)
      .eq("client_id", dataImport.client_id)
      .eq("domain", domain)
      .is("archived_at", null)
      .maybeSingle();
    if (byDomain.error) throw byDomain.error;
    duplicateId = byDomain.data?.id ?? null;
    duplicateReason = duplicateId ? "domain" : null;
  }
  if (!duplicateId && normalizedName) {
    const byName = await supabase
      .from("companies")
      .select("id")
      .eq("agency_id", dataImport.agency_id)
      .eq("client_id", dataImport.client_id)
      .eq("normalized_name", normalizedName)
      .is("archived_at", null)
      .limit(2);
    if (byName.error) throw byName.error;
    if (byName.data.length === 1) {
      duplicateId = byName.data[0]?.id ?? null;
      duplicateReason = duplicateId ? "normalized_name" : null;
    }
  }
  if (duplicateId) {
    await recordCompanySource(
      supabase,
      dataImport,
      duplicateId,
      normalized,
      rowNumber,
    );
    return {
      status: "duplicate" as const,
      companyId: duplicateId,
      duplicateReason,
    };
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      agency_id: dataImport.agency_id,
      client_id: dataImport.client_id,
      name: name ?? domain ?? "Entreprise sans nom",
      normalized_name: normalizedName,
      domain,
      website_url: optionalText(normalized.websiteUrl),
      industry: optionalText(normalized.industry),
      country_code: optionalText(normalized.countryCode)?.toUpperCase() ?? null,
      employee_count: optionalNumber(normalized.employeeCount),
      annual_revenue: optionalNumber(normalized.annualRevenue),
      revenue_currency:
        optionalText(normalized.revenueCurrency)?.toUpperCase() ?? null,
      technologies: (normalized.technologies ?? "")
        .split(/[;,]/)
        .map((value) => value.trim())
        .filter(Boolean),
      description: optionalText(normalized.description),
      fact_status: factStatus(normalized.factStatus),
      confidence_score: confidence(normalized.confidenceScore),
      verification_status: "unverified",
      source_import_id: dataImport.id,
      source_import_row_number: rowNumber,
      created_by: dataImport.created_by,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordCompanySource(
    supabase,
    dataImport,
    data.id,
    normalized,
    rowNumber,
  );
  return {
    status: "created" as const,
    companyId: data.id,
    duplicateReason: null,
  };
}

async function resolveContactCompany(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  normalized: Record<string, string>,
) {
  const domain = normalizeDomain(normalized.companyDomain);
  if (domain) {
    const result = await supabase
      .from("companies")
      .select("id")
      .eq("agency_id", dataImport.agency_id)
      .eq("client_id", dataImport.client_id)
      .eq("domain", domain)
      .is("archived_at", null)
      .maybeSingle();
    if (result.error) throw result.error;
    if (result.data) return result.data.id;
  }
  const name = normalizeName(normalized.companyName);
  if (!name) return null;
  const result = await supabase
    .from("companies")
    .select("id")
    .eq("agency_id", dataImport.agency_id)
    .eq("client_id", dataImport.client_id)
    .eq("normalized_name", name)
    .is("archived_at", null)
    .limit(2);
  if (result.error) throw result.error;
  return result.data.length === 1 ? (result.data[0]?.id ?? null) : null;
}

async function ingestContact(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
  normalized: Record<string, string>,
  rowNumber: number,
) {
  const firstName = optionalText(normalized.firstName);
  const lastName = optionalText(normalized.lastName);
  const fullName =
    optionalText(normalized.fullName) ??
    [firstName, lastName].filter(Boolean).join(" ").trim();
  const email = normalizeEmail(normalized.email);
  const linkedinUrl = normalizeLinkedin(normalized.linkedinUrl);
  const normalizedName = normalizeName(fullName);
  if (!normalizedName || (!email && !linkedinUrl)) {
    return {
      status: "invalid" as const,
      errorCodes: ["CONTACT_IDENTITY_INVALID"],
      errorMessage: "Nom et email ou LinkedIn valides requis.",
    };
  }
  const provider = optionalText(normalized.sourceProvider);
  const externalId = optionalText(normalized.externalId);
  const companyId = await resolveContactCompany(
    supabase,
    dataImport,
    normalized,
  );

  const imported = await supabase
    .from("contacts")
    .select("id")
    .eq("source_import_id", dataImport.id)
    .eq("source_import_row_number", rowNumber)
    .maybeSingle();
  if (imported.error) throw imported.error;
  if (imported.data) {
    return {
      status: "created" as const,
      contactId: imported.data.id,
      duplicateReason: null,
    };
  }

  let duplicateId = await findContactByExternalId(
    supabase,
    dataImport,
    provider,
    externalId,
  );
  let duplicateReason = duplicateId ? "external_identifier" : null;
  if (!duplicateId && email) {
    const result = await supabase
      .from("contacts")
      .select("id")
      .eq("agency_id", dataImport.agency_id)
      .eq("client_id", dataImport.client_id)
      .eq("email", email)
      .is("archived_at", null)
      .maybeSingle();
    if (result.error) throw result.error;
    duplicateId = result.data?.id ?? null;
    duplicateReason = duplicateId ? "email" : null;
  }
  if (!duplicateId && linkedinUrl) {
    const result = await supabase
      .from("contacts")
      .select("id")
      .eq("agency_id", dataImport.agency_id)
      .eq("client_id", dataImport.client_id)
      .eq("linkedin_url", linkedinUrl)
      .is("archived_at", null)
      .maybeSingle();
    if (result.error) throw result.error;
    duplicateId = result.data?.id ?? null;
    duplicateReason = duplicateId ? "linkedin" : null;
  }
  if (!duplicateId && companyId) {
    const result = await supabase
      .from("contacts")
      .select("id")
      .eq("agency_id", dataImport.agency_id)
      .eq("client_id", dataImport.client_id)
      .eq("company_id", companyId)
      .eq("normalized_name", normalizedName)
      .is("archived_at", null)
      .limit(2);
    if (result.error) throw result.error;
    if (result.data.length === 1) {
      duplicateId = result.data[0]?.id ?? null;
      duplicateReason = duplicateId ? "normalized_name_company" : null;
    }
  }
  if (duplicateId) {
    await recordContactSource(
      supabase,
      dataImport,
      duplicateId,
      normalized,
      rowNumber,
    );
    return {
      status: "duplicate" as const,
      contactId: duplicateId,
      duplicateReason,
    };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      agency_id: dataImport.agency_id,
      client_id: dataImport.client_id,
      company_id: companyId,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      normalized_name: normalizedName,
      email,
      linkedin_url: linkedinUrl,
      job_title: optionalText(normalized.jobTitle),
      department: optionalText(normalized.department),
      seniority: optionalText(normalized.seniority),
      phone: optionalText(normalized.phone),
      country_code: optionalText(normalized.countryCode)?.toUpperCase() ?? null,
      fact_status: factStatus(normalized.factStatus),
      confidence_score: confidence(normalized.confidenceScore),
      verification_status: "unverified",
      source_import_id: dataImport.id,
      source_import_row_number: rowNumber,
      created_by: dataImport.created_by,
    })
    .select("id")
    .single();
  if (error) throw error;
  await recordContactSource(
    supabase,
    dataImport,
    data.id,
    normalized,
    rowNumber,
  );
  return {
    status: "created" as const,
    contactId: data.id,
    duplicateReason: null,
  };
}

async function updateImportCounts(
  supabase: TriggerSupabaseClient,
  dataImport: ImportRow,
) {
  const { data, error } = await supabase
    .from("data_import_rows")
    .select("status")
    .eq("import_id", dataImport.id);
  if (error) throw error;
  const count = (status: string) =>
    data.filter((row) => row.status === status).length;
  await supabase
    .from("data_imports")
    .update({
      processed_row_count: data.filter((row) => row.status !== "pending")
        .length,
      created_row_count: count("created"),
      duplicate_row_count: count("duplicate"),
      invalid_row_count: count("invalid"),
      failed_row_count: count("failed"),
    })
    .eq("id", dataImport.id)
    .eq("agency_id", dataImport.agency_id)
    .eq("client_id", dataImport.client_id);
}

async function processImport(
  importId: string,
  supabase = createTriggerSupabaseClient(),
) {
  const initial = await supabase
    .from("data_imports")
    .select("*")
    .eq("id", importId)
    .single();
  if (initial.error) throw initial.error;
  const dataImport = initial.data;
  if (dataImport.status === "cancelled")
    return { status: "cancelled" as const };
  if (
    !["ready", "queued", "processing", "cancel_requested"].includes(
      dataImport.status,
    )
  ) {
    throw new Error("DATA_IMPORT_STATE_INVALID");
  }
  if (dataImport.status === "cancel_requested") {
    await supabase
      .from("data_imports")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", dataImport.id);
    return { status: "cancelled" as const };
  }

  const claim = await supabase
    .from("data_imports")
    .update({
      status: "processing",
      started_at: dataImport.started_at ?? new Date().toISOString(),
    })
    .eq("id", dataImport.id)
    .eq("agency_id", dataImport.agency_id)
    .eq("client_id", dataImport.client_id)
    .in("status", ["ready", "queued", "processing"])
    .select("*")
    .single();
  if (claim.error) throw claim.error;

  const storageObject = await supabase.storage
    .from("lead-imports")
    .download(dataImport.storage_path);
  if (storageObject.error) throw storageObject.error;
  const csv = parseCsv(
    await storageObject.data.text(),
    dataImport.delimiter as "," | ";" | "\t" | "|",
    Number.MAX_SAFE_INTEGER,
  );
  if (
    csv.issues.some((issue) => !issue.startsWith("CSV_COLUMN_COUNT_MISMATCH"))
  ) {
    throw new Error("CSV_STRUCTURE_INVALID");
  }
  const mapping = dataImport.column_mapping as Mapping;

  for (let offset = 0; offset < csv.rows.length; offset += BATCH_SIZE) {
    const state = await supabase
      .from("data_imports")
      .select("status")
      .eq("id", dataImport.id)
      .single();
    if (state.error) throw state.error;
    if (state.data.status === "cancel_requested") {
      await supabase
        .from("data_import_rows")
        .update({
          status: "cancelled",
          processed_at: new Date().toISOString(),
        })
        .eq("import_id", dataImport.id)
        .eq("status", "pending");
      await updateImportCounts(supabase, dataImport);
      await supabase
        .from("data_imports")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", dataImport.id);
      return { status: "cancelled" as const };
    }

    const batch = csv.rows.slice(offset, offset + BATCH_SIZE);
    for (let batchIndex = 0; batchIndex < batch.length; batchIndex += 1) {
      const raw = batch[batchIndex];
      if (!raw) continue;
      const rowNumber = offset + batchIndex + 2;
      const normalized = applyMapping(raw, mapping);
      const existing = await supabase
        .from("data_import_rows")
        .select("status")
        .eq("import_id", dataImport.id)
        .eq("row_number", rowNumber)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data && existing.data.status !== "pending") continue;
      if (!existing.data) {
        const pending = await supabase.from("data_import_rows").insert({
          agency_id: dataImport.agency_id,
          client_id: dataImport.client_id,
          import_id: dataImport.id,
          row_number: rowNumber,
          status: "pending",
          raw_data: normalized as Json,
          normalized_data: normalized as Json,
        });
        if (pending.error?.code !== "23505") {
          if (pending.error) throw pending.error;
        }
      }

      try {
        const result =
          dataImport.entity_type === "company"
            ? await ingestCompany(supabase, dataImport, normalized, rowNumber)
            : await ingestContact(supabase, dataImport, normalized, rowNumber);
        const { error } = await supabase
          .from("data_import_rows")
          .update({
            status: result.status,
            company_id: "companyId" in result ? result.companyId : null,
            contact_id: "contactId" in result ? result.contactId : null,
            duplicate_reason:
              "duplicateReason" in result ? result.duplicateReason : null,
            error_codes:
              "errorCodes" in result ? result.errorCodes : ([] as string[]),
            error_message:
              "errorMessage" in result ? result.errorMessage : null,
            processed_at: new Date().toISOString(),
          })
          .eq("import_id", dataImport.id)
          .eq("row_number", rowNumber);
        if (error) throw error;
      } catch (error) {
        logger.error("Import row failed", {
          importId: dataImport.id,
          rowNumber,
          errorCode:
            error && typeof error === "object" && "code" in error
              ? String(error.code)
              : "UNKNOWN",
        });
        await supabase
          .from("data_import_rows")
          .update({
            status: "failed",
            error_codes: ["ROW_PERSISTENCE_FAILED"],
            error_message: "La ligne n’a pas pu être enregistrée.",
            processed_at: new Date().toISOString(),
          })
          .eq("import_id", dataImport.id)
          .eq("row_number", rowNumber);
      }
    }
    await updateImportCounts(supabase, dataImport);
  }

  await updateImportCounts(supabase, dataImport);
  const counts = await supabase
    .from("data_imports")
    .select("invalid_row_count,failed_row_count")
    .eq("id", dataImport.id)
    .single();
  if (counts.error) throw counts.error;
  const finalStatus =
    counts.data.invalid_row_count + counts.data.failed_row_count > 0
      ? "completed_with_errors"
      : "completed";
  const { error: completionError } = await supabase
    .from("data_imports")
    .update({ status: finalStatus, completed_at: new Date().toISOString() })
    .eq("id", dataImport.id)
    .eq("agency_id", dataImport.agency_id)
    .eq("client_id", dataImport.client_id);
  if (completionError) throw completionError;
  await supabase.from("audit_logs").insert({
    agency_id: dataImport.agency_id,
    client_id: dataImport.client_id,
    created_by: null,
    action: "import.completed",
    resource_type: "data_import",
    resource_id: dataImport.id,
    metadata: {
      actor: "trigger.dev",
      status: finalStatus,
    },
  });
  return { status: finalStatus };
}

async function loadImportResource(
  supabase: TriggerSupabaseClient,
  resourceId: string,
): Promise<VerifiedTaskResource> {
  const response = await supabase
    .from("data_imports")
    .select("agency_id,client_id,created_by")
    .eq("id", resourceId)
    .single();
  if (response.error) throw response.error;

  return {
    agencyId: response.data.agency_id,
    clientId: response.data.client_id,
    createdBy: response.data.created_by,
    resourceType: "data_import",
  };
}

export const processCsvImport = schemaTask({
  id: "import.processCsv",
  schema: durableTaskPayloadSchema,
  maxDuration: 900,
  retry: triggerRetryPolicy,
  queue: {
    name: "csv-imports",
    concurrencyLimit: 5,
  },
  onFailure: async ({ payload }) => {
    const supabase = createTriggerSupabaseClient();
    await supabase
      .from("data_imports")
      .update({
        status: "failed",
        error_summary: { code: "IMPORT_PROCESSING_FAILED" },
        completed_at: new Date().toISOString(),
      })
      .eq("id", payload.resourceId)
      .eq("agency_id", payload.agencyId)
      .eq("client_id", payload.clientId)
      .in("status", ["ready", "queued", "processing"]);
  },
  run: async (payload, { ctx }) => {
    logger.info("CSV import requested", {
      resourceId: payload.resourceId,
      triggerRunId: ctx.run.id,
    });
    return executeDurableTask({
      taskId: "import.processCsv",
      triggerRunId: ctx.run.id,
      payload,
      loadResource: loadImportResource,
      execute: async (supabase) => {
        const result = await processImport(payload.resourceId, supabase);
        return { result };
      },
    });
  },
});
