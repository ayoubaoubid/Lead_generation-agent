import { z } from "zod";

import { emailVerificationResults } from "@/domain/enrichment/provider-operation";

const nullableText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).nullable();

export const enrichCompanyCommandSchema = z
  .object({
    companyId: z.uuid(),
    idempotencyKey: z.string().trim().min(8).max(200),
  })
  .strict();

export const enrichContactCommandSchema = z
  .object({
    contactId: z.uuid(),
    idempotencyKey: z.string().trim().min(8).max(200),
  })
  .strict();

export const validateDomainCommandSchema = z
  .object({
    companyId: z.uuid().nullable(),
    domain: z.string().trim().min(3).max(253),
    idempotencyKey: z.string().trim().min(8).max(200),
  })
  .strict();

export const companyEnrichmentResultSchema = z
  .object({
    legalName: nullableText(300),
    domain: nullableText(253),
    websiteUrl: z.url().max(2_048).nullable(),
    industry: nullableText(200),
    countryCode: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}$/u)
      .nullable(),
    employeeCount: z.number().int().nonnegative().nullable(),
    annualRevenue: z.number().nonnegative().nullable(),
    revenueCurrency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/u)
      .nullable(),
    technologies: z.array(z.string().trim().min(1).max(100)).max(100),
    confidenceScore: z.number().int().min(0).max(100).nullable(),
    source: z.string().trim().min(1).max(200),
  })
  .strict();

export const contactEnrichmentResultSchema = z
  .object({
    firstName: nullableText(100),
    lastName: nullableText(100),
    fullName: nullableText(200),
    jobTitle: nullableText(200),
    department: nullableText(150),
    seniority: nullableText(100),
    linkedinUrl: z.url().max(2_048).nullable(),
    phone: nullableText(50),
    countryCode: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}$/u)
      .nullable(),
    confidenceScore: z.number().int().min(0).max(100).nullable(),
    source: z.string().trim().min(1).max(200),
  })
  .strict();

export const domainValidationResultSchema = z
  .object({
    domain: z.string().trim().min(3).max(253),
    status: z.enum(["valid", "invalid", "unknown"]),
    hasMxRecords: z.boolean().nullable(),
    acceptsEmail: z.boolean().nullable(),
    isDisposable: z.boolean().nullable(),
    confidenceScore: z.number().int().min(0).max(100).nullable(),
    source: z.string().trim().min(1).max(200),
  })
  .strict();

export const emailVerificationResultSchema = z
  .object({
    status: z.enum(emailVerificationResults),
    providerStatus: z.string().trim().min(1).max(100),
    providerSubStatus: nullableText(200),
    checkedAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }).nullable(),
    confidenceScore: z.number().int().min(0).max(100).nullable(),
    source: z.string().trim().min(1).max(200),
  })
  .strict();

export type EnrichCompanyCommand = z.infer<typeof enrichCompanyCommandSchema>;
export type EnrichContactCommand = z.infer<typeof enrichContactCommandSchema>;
export type ValidateDomainCommand = z.infer<typeof validateDomainCommandSchema>;
export type CompanyEnrichmentResult = z.infer<
  typeof companyEnrichmentResultSchema
>;
export type ContactEnrichmentResult = z.infer<
  typeof contactEnrichmentResultSchema
>;
export type DomainValidationResult = z.infer<
  typeof domainValidationResultSchema
>;
