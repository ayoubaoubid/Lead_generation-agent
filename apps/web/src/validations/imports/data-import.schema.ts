import { z } from "zod";

import { dataImportEntityTypes } from "@/domain/imports/data-import";
import { dataFactStatuses } from "@/domain/lead-data/data-quality";

export const csvDelimiters = [",", ";", "\t", "|"] as const;
export const csvDelimiterSchema = z.enum(csvDelimiters);
export const dataImportEntityTypeSchema = z.enum(dataImportEntityTypes);

export const companyImportFields = [
  "name",
  "domain",
  "websiteUrl",
  "industry",
  "countryCode",
  "employeeCount",
  "annualRevenue",
  "revenueCurrency",
  "technologies",
  "description",
  "sourceProvider",
  "externalId",
  "sourceUrl",
  "collectedAt",
  "confidenceScore",
  "factStatus",
] as const;

export const contactImportFields = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "linkedinUrl",
  "jobTitle",
  "department",
  "seniority",
  "phone",
  "countryCode",
  "companyDomain",
  "companyName",
  "sourceProvider",
  "externalId",
  "sourceUrl",
  "collectedAt",
  "confidenceScore",
  "factStatus",
] as const;

export type CompanyImportField = (typeof companyImportFields)[number];
export type ContactImportField = (typeof contactImportFields)[number];
export type ImportField = CompanyImportField | ContactImportField;
export type ImportColumnMapping = Readonly<
  Partial<Record<ImportField, string>>
>;

const mappingSchema = z.record(z.string(), z.string().trim().min(1).max(240));

export const prepareDataImportSchema = z
  .object({
    entityType: dataImportEntityTypeSchema,
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(240)
      .regex(/^[^/\\]+\.csv$/i),
    mimeType: z
      .enum([
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "text/plain",
      ])
      .default("text/csv"),
    fileSizeBytes: z
      .number()
      .int()
      .min(1)
      .max(6 * 1024 * 1024),
    fileSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    delimiter: csvDelimiterSchema,
    columnMapping: mappingSchema,
    estimatedRowCount: z.number().int().min(1).max(250_000),
  })
  .superRefine((value, context) => {
    const keys = Object.keys(value.columnMapping);
    const allowed =
      value.entityType === "company"
        ? companyImportFields
        : contactImportFields;
    if (keys.some((key) => !allowed.includes(key as never))) {
      context.addIssue({
        code: "custom",
        path: ["columnMapping"],
        message: "Le mapping contient un champ inconnu.",
      });
    }
    if (
      value.entityType === "company" &&
      !value.columnMapping.name &&
      !value.columnMapping.domain
    ) {
      context.addIssue({
        code: "custom",
        path: ["columnMapping"],
        message: "Mappez au moins le nom ou le domaine de l’entreprise.",
      });
    }
    if (
      value.entityType === "contact" &&
      !value.columnMapping.email &&
      !value.columnMapping.linkedinUrl &&
      !value.columnMapping.fullName
    ) {
      context.addIssue({
        code: "custom",
        path: ["columnMapping"],
        message: "Mappez au moins l’email, LinkedIn ou le nom complet.",
      });
    }
    if (new Set(Object.values(value.columnMapping)).size !== keys.length) {
      context.addIssue({
        code: "custom",
        path: ["columnMapping"],
        message: "Une colonne CSV ne peut être mappée qu’une seule fois.",
      });
    }
  });

export type PrepareDataImportInput = z.infer<typeof prepareDataImportSchema>;

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);
const optionalInteger = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number.parseInt(value, 10)))
  .pipe(z.number().int().nonnegative().nullable());
const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .pipe(z.number().nonnegative().nullable());
const optionalConfidence = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number.parseInt(value, 10)))
  .pipe(z.number().int().min(0).max(100).nullable());
const optionalFactStatus = z
  .string()
  .trim()
  .transform((value) => value || "extracted")
  .pipe(z.enum(dataFactStatuses));

export const importedCompanySchema = z
  .object({
    name: optionalText,
    domain: optionalText,
    websiteUrl: optionalText,
    industry: optionalText,
    countryCode: optionalText,
    employeeCount: optionalInteger,
    annualRevenue: optionalNumber,
    revenueCurrency: optionalText,
    technologies: z.string().transform((value) =>
      value
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
    description: optionalText,
    sourceProvider: optionalText,
    externalId: optionalText,
    sourceUrl: optionalText,
    collectedAt: optionalText,
    confidenceScore: optionalConfidence,
    factStatus: optionalFactStatus,
  })
  .superRefine((value, context) => {
    if (!value.name && !value.domain) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "Une entreprise doit avoir un nom ou un domaine.",
      });
    }
  });

export const importedContactSchema = z
  .object({
    firstName: optionalText,
    lastName: optionalText,
    fullName: optionalText,
    email: optionalText,
    linkedinUrl: optionalText,
    jobTitle: optionalText,
    department: optionalText,
    seniority: optionalText,
    phone: optionalText,
    countryCode: optionalText,
    companyDomain: optionalText,
    companyName: optionalText,
    sourceProvider: optionalText,
    externalId: optionalText,
    sourceUrl: optionalText,
    collectedAt: optionalText,
    confidenceScore: optionalConfidence,
    factStatus: optionalFactStatus,
  })
  .superRefine((value, context) => {
    const name =
      value.fullName ??
      [value.firstName, value.lastName].filter(Boolean).join(" ").trim();
    if (!name) {
      context.addIssue({
        code: "custom",
        path: ["fullName"],
        message: "Le nom du contact est requis.",
      });
    }
    if (!value.email && !value.linkedinUrl) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Un email ou un profil LinkedIn est requis.",
      });
    }
  });

export function applyImportMapping(
  raw: Readonly<Record<string, string>>,
  mapping: ImportColumnMapping,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(mapping).map(([field, header]) => [
      field,
      header ? (raw[header] ?? "") : "",
    ]),
  );
}
