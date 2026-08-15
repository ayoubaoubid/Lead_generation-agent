import { z } from "zod";

export const emailVerificationStatuses = [
  "valid",
  "invalid",
  "risky",
  "catch_all",
  "unknown",
  "disposable",
  "role_based",
  "bounced",
  "suppressed",
  "unsubscribed",
] as const;

export const verifyContactEmailCommandSchema = z
  .object({
    contactId: z.uuid(),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(200)
      .regex(/^[a-z0-9][a-z0-9:._-]+$/i),
  })
  .strict();

export type VerifyContactEmailCommand = z.infer<
  typeof verifyContactEmailCommandSchema
>;

export const normalizedEmailSchema = z
  .string()
  .trim()
  .max(320)
  .pipe(z.email())
  .transform((email) => email.toLowerCase());

export const normalizedEmailVerificationSchema = z
  .object({
    status: z.enum(emailVerificationStatuses),
    providerStatus: z.string().trim().min(1).max(100),
    providerSubStatus: z.string().trim().min(1).max(200).nullable(),
    checkedAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }).nullable(),
    confidenceScore: z.number().int().min(0).max(100).nullable(),
  })
  .strict();

export type NormalizedEmailVerification = z.infer<
  typeof normalizedEmailVerificationSchema
>;
