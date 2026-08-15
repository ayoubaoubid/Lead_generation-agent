import { z } from "zod";

import {
  confidenceScoreSchema,
  dataFactStatusSchema,
  optionalTrimmedText,
} from "@/validations/lead-data/data-quality.schema";

export const createContactSchema = z
  .object({
    companyId: z.union([z.literal("").transform(() => null), z.uuid()]),
    firstName: optionalTrimmedText(100),
    lastName: optionalTrimmedText(100),
    fullName: optionalTrimmedText(200),
    email: z.union([z.literal("").transform(() => null), z.email().max(320)]),
    linkedinUrl: z.union([
      z.literal("").transform(() => null),
      z
        .url()
        .max(500)
        .refine((value) => new URL(value).hostname.endsWith("linkedin.com")),
    ]),
    jobTitle: optionalTrimmedText(160),
    department: optionalTrimmedText(120),
    seniority: optionalTrimmedText(100),
    phone: optionalTrimmedText(60),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => value === "" || /^[A-Z]{2}$/.test(value))
      .transform((value) => value || null),
    factStatus: dataFactStatusSchema.default("confirmed"),
    confidenceScore: confidenceScoreSchema,
    sourceProvider: optionalTrimmedText(100),
    externalId: optionalTrimmedText(200),
    sourceUrl: z.union([
      z.literal("").transform(() => null),
      z.url().max(1000),
    ]),
    collectedAt: z.iso.datetime({ offset: true }).nullable(),
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
    if (value.externalId && !value.sourceProvider) {
      context.addIssue({
        code: "custom",
        path: ["sourceProvider"],
        message: "La source est requise avec un identifiant externe.",
      });
    }
  });

export type CreateContactInput = z.infer<typeof createContactSchema>;
