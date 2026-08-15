import { z } from "zod";

import {
  confidenceScoreSchema,
  dataFactStatusSchema,
  optionalTrimmedText,
} from "@/validations/lead-data/data-quality.schema";

const optionalInteger = z.union([
  z.literal("").transform(() => null),
  z.coerce.number().int().nonnegative(),
]);
const optionalMoney = z.union([
  z.literal("").transform(() => null),
  z.coerce.number().nonnegative(),
]);

export const createCompanySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    domain: optionalTrimmedText(253),
    websiteUrl: z.union([
      z.literal("").transform(() => null),
      z.url().max(500),
    ]),
    industry: optionalTrimmedText(120),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => value === "" || /^[A-Z]{2}$/.test(value))
      .transform((value) => value || null),
    employeeCount: optionalInteger,
    annualRevenue: optionalMoney,
    revenueCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => value === "" || /^[A-Z]{3}$/.test(value))
      .transform((value) => value || null),
    technologies: z
      .string()
      .max(1000)
      .transform((value) =>
        value
          .split(",")
          .map((technology) => technology.trim())
          .filter(Boolean),
      ),
    description: optionalTrimmedText(2000),
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
    if (value.externalId && !value.sourceProvider) {
      context.addIssue({
        code: "custom",
        path: ["sourceProvider"],
        message: "La source est requise avec un identifiant externe.",
      });
    }
  });

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
