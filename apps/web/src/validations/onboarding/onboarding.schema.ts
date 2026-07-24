import { z } from "zod";

import {
  onboardingSectionKeys,
  type OnboardingAnswerData,
  type OnboardingSectionKey,
} from "@/domain/onboarding/onboarding";

const boundedText = (maxLength: number) => z.string().trim().max(maxLength);

const lineList = (maxItems: number, maxItemLength = 240) =>
  z
    .string()
    .max(maxItems * (maxItemLength + 2))
    .transform((value) => [
      ...new Set(
        value
          .split(/\r?\n/u)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().max(maxItemLength)).max(maxItems));

const urlList = (maxItems: number) =>
  lineList(maxItems, 2048).pipe(z.array(z.url()).max(maxItems));

const optionalUrl = z
  .union([z.literal(""), z.url().max(2048)])
  .transform((value) => value || null);

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .pipe(z.number().finite().nonnegative().nullable());

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/u.test(value), {
    message: "Utilisez une date valide.",
  })
  .transform((value) => value || null);

export const onboardingSectionKeySchema = z.enum(onboardingSectionKeys);

export const onboardingStepQuerySchema = z.object({
  step: z.coerce.number().int().min(1).max(14).catch(1),
});

export const onboardingActionSchema = z.object({
  sectionKey: onboardingSectionKeySchema,
  currentStep: z.coerce.number().int().min(1).max(14),
  intent: z.enum(["save_draft", "complete_step"]),
});

export const onboardingLifecycleActionSchema = z.object({
  intent: z.enum(["complete_onboarding", "validate_onboarding"]),
});

const sectionSchemas = {
  company_information: z.object({
    companyName: boundedText(160),
    websiteUrl: optionalUrl,
    industry: boundedText(120),
    countryCode: boundedText(2).transform((value) => value.toUpperCase()),
    employeeRange: boundedText(80),
    description: boundedText(2000),
  }),
  products_services: z.object({
    primaryProductsServices: lineList(30),
    deliveryModel: boundedText(500),
    differentiators: lineList(20),
  }),
  current_offer: z.object({
    offerName: boundedText(160),
    offerSummary: boundedText(2000),
    desiredOutcome: boundedText(1000),
    includedItems: lineList(30),
    guarantees: lineList(20),
  }),
  pricing: z
    .object({
      pricingModel: boundedText(120),
      currencyCode: boundedText(3).transform((value) => value.toUpperCase()),
      minimumPrice: optionalNumber,
      maximumPrice: optionalNumber,
      pricingNotes: boundedText(1000),
    })
    .refine(
      (value) =>
        value.minimumPrice === null ||
        value.maximumPrice === null ||
        value.minimumPrice <= value.maximumPrice,
      {
        message: "Le prix maximum doit être supérieur au prix minimum.",
        path: ["maximumPrice"],
      },
    ),
  existing_customers: z.object({
    customerTypes: lineList(30),
    representativeCustomers: lineList(30),
    buyingReasons: lineList(30),
  }),
  customer_cases: z.object({
    caseSummaries: lineList(30, 1000),
    measuredResults: lineList(30, 500),
    sourceLinks: urlList(20),
  }),
  available_proofs: z.object({
    proofTypes: lineList(20),
    proofStatements: lineList(30, 1000),
    sourceLinks: urlList(20),
    usageAuthorized: z.enum(["yes", "no", "unknown"]),
  }),
  competitors: z.object({
    directCompetitors: lineList(30),
    alternatives: lineList(30),
    strengths: lineList(30),
    weaknesses: lineList(30),
  }),
  problems_solved: z.object({
    problems: lineList(30, 500),
    businessImpacts: lineList(30, 500),
    urgencySignals: lineList(30, 500),
    currentWorkarounds: lineList(30, 500),
  }),
  sales_process: z.object({
    stages: lineList(20),
    averageCycleDays: optionalNumber,
    salesTeamRoles: lineList(20),
    commonObjections: lineList(30, 500),
  }),
  target_markets: z.object({
    industries: lineList(30),
    countries: lineList(30),
    companySizes: lineList(20),
    languages: lineList(20),
    excludedSegments: lineList(30),
  }),
  objectives: z.object({
    primaryObjective: boundedText(1000),
    successMetrics: lineList(30),
    targetDate: optionalDate,
    constraints: lineList(30, 500),
  }),
  existing_channels: z.object({
    activeChannels: lineList(20),
    pastChannels: lineList(20),
    observedResults: lineList(30, 500),
    channelConstraints: lineList(30, 500),
  }),
  available_integrations: z.object({
    crmSystems: lineList(20),
    emailSystems: lineList(20),
    calendarSystems: lineList(20),
    dataSources: lineList(30),
    integrationNotes: boundedText(1000),
  }),
} as const satisfies Record<OnboardingSectionKey, z.ZodType>;

export const onboardingSectionInputKeys: Readonly<
  Record<OnboardingSectionKey, readonly string[]>
> = {
  company_information: [
    "companyName",
    "websiteUrl",
    "industry",
    "countryCode",
    "employeeRange",
    "description",
  ],
  products_services: [
    "primaryProductsServices",
    "deliveryModel",
    "differentiators",
  ],
  current_offer: [
    "offerName",
    "offerSummary",
    "desiredOutcome",
    "includedItems",
    "guarantees",
  ],
  pricing: [
    "pricingModel",
    "currencyCode",
    "minimumPrice",
    "maximumPrice",
    "pricingNotes",
  ],
  existing_customers: [
    "customerTypes",
    "representativeCustomers",
    "buyingReasons",
  ],
  customer_cases: ["caseSummaries", "measuredResults", "sourceLinks"],
  available_proofs: [
    "proofTypes",
    "proofStatements",
    "sourceLinks",
    "usageAuthorized",
  ],
  competitors: ["directCompetitors", "alternatives", "strengths", "weaknesses"],
  problems_solved: [
    "problems",
    "businessImpacts",
    "urgencySignals",
    "currentWorkarounds",
  ],
  sales_process: [
    "stages",
    "averageCycleDays",
    "salesTeamRoles",
    "commonObjections",
  ],
  target_markets: [
    "industries",
    "countries",
    "companySizes",
    "languages",
    "excludedSegments",
  ],
  objectives: [
    "primaryObjective",
    "successMetrics",
    "targetDate",
    "constraints",
  ],
  existing_channels: [
    "activeChannels",
    "pastChannels",
    "observedResults",
    "channelConstraints",
  ],
  available_integrations: [
    "crmSystems",
    "emailSystems",
    "calendarSystems",
    "dataSources",
    "integrationNotes",
  ],
};

const requiredFields: Readonly<
  Record<OnboardingSectionKey, readonly string[]>
> = {
  company_information: ["companyName", "industry", "description"],
  products_services: ["primaryProductsServices"],
  current_offer: ["offerName", "offerSummary", "desiredOutcome"],
  pricing: ["pricingModel", "currencyCode"],
  existing_customers: ["customerTypes"],
  customer_cases: ["caseSummaries"],
  available_proofs: ["proofTypes", "proofStatements"],
  competitors: ["directCompetitors", "alternatives"],
  problems_solved: ["problems", "businessImpacts"],
  sales_process: ["stages"],
  target_markets: ["industries", "countries"],
  objectives: ["primaryObjective", "successMetrics"],
  existing_channels: ["activeChannels"],
  available_integrations: ["emailSystems"],
};

function hasContent(value: unknown): boolean {
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

export function parseOnboardingSectionInput(
  sectionKey: OnboardingSectionKey,
  input: Readonly<Record<string, string>>,
  requireComplete: boolean,
): OnboardingAnswerData {
  const data = sectionSchemas[sectionKey].parse(input) as OnboardingAnswerData;

  if (requireComplete) {
    const missingFields = requiredFields[sectionKey].filter(
      (fieldName) => !hasContent(data[fieldName]),
    );

    if (missingFields.length > 0) {
      throw new z.ZodError(
        missingFields.map((fieldName) => ({
          code: "custom",
          message: "Ce champ est requis pour terminer cette étape.",
          path: [fieldName],
        })),
      );
    }
  }

  return data;
}

export function serializeOnboardingFieldValue(
  value: OnboardingAnswerData[string] | undefined,
): string {
  if (Array.isArray(value)) return value.join("\n");
  if (value === null || value === undefined) return "";
  return String(value);
}
