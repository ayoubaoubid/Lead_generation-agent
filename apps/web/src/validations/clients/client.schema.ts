import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || null);

const optionalHttpUrl = z
  .union([z.literal(""), z.url().max(2048)])
  .transform((value) => value || null)
  .refine(
    (value) =>
      value === null ||
      value.startsWith("https://") ||
      value.startsWith("http://"),
    "L’URL doit utiliser HTTP ou HTTPS.",
  );

const optionalHttpsUrl = z
  .union([z.literal(""), z.url().max(2048)])
  .transform((value) => value || null)
  .refine(
    (value) => value === null || value.startsWith("https://"),
    "Le logo doit utiliser une URL HTTPS.",
  );

const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => value === "" || /^[A-Z]{2}$/u.test(value), {
    message: "Utilisez un code pays ISO à deux lettres.",
  })
  .transform((value) => value || null);

const languageCodeSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^[a-z]{2,3}(?:-[A-Z]{2})?$/u.test(value),
    { message: "Utilisez un code langue comme fr ou fr-FR." },
  )
  .transform((value) => value || null);

const timezoneSchema = z
  .string()
  .trim()
  .max(64)
  .refine(
    (value) =>
      value === "" ||
      value === "UTC" ||
      /^[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)+$/u.test(value),
    { message: "Utilisez un fuseau IANA comme Europe/Paris." },
  )
  .transform((value) => value || null);

const objectivesSchema = z
  .string()
  .max(5000)
  .transform((value) => [
    ...new Set(
      value
        .split(/\r?\n/u)
        .map((objective) => objective.trim())
        .filter(Boolean),
    ),
  ])
  .pipe(z.array(z.string().max(240)).max(20));

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

const editableStatusSchema = z.enum([
  "draft",
  "onboarding",
  "active",
  "paused",
]);

const clientProfileFields = {
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  legalName: optionalText(200),
  websiteUrl: optionalHttpUrl,
  industry: optionalText(120),
  countryCode: countryCodeSchema,
  languageCode: languageCodeSchema,
  timezone: timezoneSchema,
  description: optionalText(2000),
  logoUrl: optionalHttpsUrl,
  objectives: objectivesSchema,
} as const;

export const createClientProfileSchema = z.object({
  ...clientProfileFields,
  status: z.enum(["draft", "onboarding"]),
});

export const updateClientProfileSchema = z.object({
  clientId: z.uuid(),
  ...clientProfileFields,
  status: editableStatusSchema,
});

export const archiveClientSchema = z.object({
  clientId: z.uuid(),
  confirmation: z.literal("ARCHIVER"),
});

export const clientRouteParamsSchema = z.object({
  clientId: z.uuid(),
});

export const clientListQuerySchema = z.object({
  q: z.string().trim().max(80).catch(""),
  status: z
    .enum(["current", "draft", "onboarding", "active", "paused", "archived"])
    .catch("current"),
  industry: z.string().trim().max(120).catch(""),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === "" || /^[A-Z]{2}$/u.test(value))
    .catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export type CreateClientProfileInput = z.infer<
  typeof createClientProfileSchema
>;
export type UpdateClientProfileInput = z.infer<
  typeof updateClientProfileSchema
>;
export type ClientListQueryInput = z.infer<typeof clientListQuerySchema>;
