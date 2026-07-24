import { z } from "zod";

import {
  decisionPowerLevels,
  scoringCriteria,
  targetingLifecycleStatuses,
  targetingProfileTypes,
  type IcpContent,
  type PersonaContent,
  type TargetingContent,
  type TargetingProfileType,
} from "@/domain/targeting/targeting-profile";

const textItemSchema = z.string().trim().min(1).max(500);
const textListSchema = z.array(textItemSchema).max(100);
const nullableNonNegativeNumber = z.number().nonnegative().nullable();

const numericRangeSchema = z
  .object({
    min: nullableNonNegativeNumber,
    max: nullableNonNegativeNumber,
  })
  .strict()
  .refine(
    ({ min, max }) => min === null || max === null || min <= max,
    "La borne minimale doit être inférieure à la borne maximale.",
  );

const moneyRangeSchema = numericRangeSchema
  .extend({
    currencyCode: z.union([z.literal(""), z.string().regex(/^[A-Z]{3}$/u)]),
  })
  .strict()
  .refine(
    ({ currencyCode, min, max }) =>
      (min === null && max === null) || currencyCode.length === 3,
    "Une devise ISO est requise lorsqu’un montant est renseigné.",
  );

export const icpContentSchema = z
  .object({
    rationale: textListSchema,
    industries: textListSchema,
    countries: textListSchema,
    companySizes: textListSchema,
    employeeCount: numericRangeSchema,
    annualRevenue: moneyRangeSchema,
    technologies: textListSchema,
    maturityLevels: textListSchema,
    budget: moneyRangeSchema,
    problems: textListSchema,
    intentSignals: textListSchema,
    exclusions: textListSchema,
    scoringWeights: z
      .array(
        z
          .object({
            criterion: z.enum(scoringCriteria),
            weight: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(scoringCriteria.length)
      .refine(
        (items) =>
          new Set(items.map(({ criterion }) => criterion)).size ===
          items.length,
        "Chaque critère de scoring ne peut apparaître qu’une fois.",
      ),
    assumptions: textListSchema,
    missingEvidence: textListSchema,
  })
  .strict();

export const validatableIcpContentSchema = icpContentSchema
  .refine(
    (content) =>
      content.industries.length > 0 ||
      content.countries.length > 0 ||
      content.companySizes.length > 0 ||
      content.technologies.length > 0,
    "Renseignez au moins un critère de ciblage.",
  )
  .refine(
    (content) => content.problems.length > 0,
    "Renseignez au moins un problème client.",
  )
  .refine(
    (content) =>
      content.scoringWeights.length > 0 &&
      content.scoringWeights.reduce((sum, item) => sum + item.weight, 0) ===
        100,
    "Les poids de scoring doivent totaliser 100.",
  );

export const personaContentSchema = z
  .object({
    rationale: textListSchema,
    jobTitles: textListSchema,
    departments: textListSchema,
    seniorityLevels: textListSchema,
    responsibilities: textListSchema,
    goals: textListSchema,
    problems: textListSchema,
    objections: textListSchema,
    decisionPower: z.enum(decisionPowerLevels),
    buyingRoles: textListSchema,
    preferredChannels: textListSchema,
    assumptions: textListSchema,
    missingEvidence: textListSchema,
  })
  .strict();

export const validatablePersonaContentSchema = personaContentSchema
  .refine(
    (content) => content.jobTitles.length > 0,
    "Renseignez au moins un poste.",
  )
  .refine(
    (content) => content.goals.length > 0 || content.problems.length > 0,
    "Renseignez au moins un objectif ou un problème.",
  )
  .refine(
    (content) => content.buyingRoles.length > 0,
    "Renseignez au moins un rôle dans l’achat.",
  );

export const targetingProfileTypeSchema = z.enum(targetingProfileTypes);
export const targetingLifecycleSchema = z.enum(targetingLifecycleStatuses);
export const targetingNameSchema = z.string().trim().min(1).max(160);
export const targetingObjectiveSchema = z.string().trim().min(20).max(8000);

export const targetingProposalSchema = z
  .object({
    icps: z
      .array(
        z
          .object({
            name: targetingNameSchema,
            content: icpContentSchema,
          })
          .strict(),
      )
      .max(3),
    personas: z
      .array(
        z
          .object({
            name: targetingNameSchema,
            content: personaContentSchema,
          })
          .strict(),
      )
      .max(3),
  })
  .strict()
  .refine(
    ({ icps, personas }) => icps.length + personas.length > 0,
    "La proposition IA ne contient aucun profil.",
  );

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function textLines(formData: FormData, key: string): string[] {
  return [
    ...new Set(
      formString(formData, key)
        .split(/\r?\n/u)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function nullableNumber(formData: FormData, key: string): number | null {
  const value = formString(formData, key);
  return value === "" ? null : z.coerce.number().nonnegative().parse(value);
}

export function parseTargetingContentForm(
  formData: FormData,
  profileType: "icp",
): IcpContent;
export function parseTargetingContentForm(
  formData: FormData,
  profileType: "persona",
): PersonaContent;
export function parseTargetingContentForm(
  formData: FormData,
  profileType: TargetingProfileType,
): TargetingContent {
  if (profileType === "icp") {
    return icpContentSchema.parse({
      rationale: textLines(formData, "rationale"),
      industries: textLines(formData, "industries"),
      countries: textLines(formData, "countries"),
      companySizes: textLines(formData, "companySizes"),
      employeeCount: {
        min: nullableNumber(formData, "employeeCount.min"),
        max: nullableNumber(formData, "employeeCount.max"),
      },
      annualRevenue: {
        min: nullableNumber(formData, "annualRevenue.min"),
        max: nullableNumber(formData, "annualRevenue.max"),
        currencyCode: formString(formData, "annualRevenue.currencyCode"),
      },
      technologies: textLines(formData, "technologies"),
      maturityLevels: textLines(formData, "maturityLevels"),
      budget: {
        min: nullableNumber(formData, "budget.min"),
        max: nullableNumber(formData, "budget.max"),
        currencyCode: formString(formData, "budget.currencyCode"),
      },
      problems: textLines(formData, "problems"),
      intentSignals: textLines(formData, "intentSignals"),
      exclusions: textLines(formData, "exclusions"),
      scoringWeights: scoringCriteria.flatMap((criterion) => {
        const value = formString(formData, `scoring.${criterion}`);
        return value === ""
          ? []
          : [{ criterion, weight: z.coerce.number().int().parse(value) }];
      }),
      assumptions: textLines(formData, "assumptions"),
      missingEvidence: textLines(formData, "missingEvidence"),
    });
  }

  return personaContentSchema.parse({
    rationale: textLines(formData, "rationale"),
    jobTitles: textLines(formData, "jobTitles"),
    departments: textLines(formData, "departments"),
    seniorityLevels: textLines(formData, "seniorityLevels"),
    responsibilities: textLines(formData, "responsibilities"),
    goals: textLines(formData, "goals"),
    problems: textLines(formData, "problems"),
    objections: textLines(formData, "objections"),
    decisionPower: formString(formData, "decisionPower") || "unknown",
    buyingRoles: textLines(formData, "buyingRoles"),
    preferredChannels: textLines(formData, "preferredChannels"),
    assumptions: textLines(formData, "assumptions"),
    missingEvidence: textLines(formData, "missingEvidence"),
  });
}
