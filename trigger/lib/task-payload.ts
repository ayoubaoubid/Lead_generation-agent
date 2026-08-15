import { z } from "zod";

export const durableTaskPayloadSchema = z
  .object({
    agencyId: z.uuid(),
    clientId: z.uuid(),
    actorId: z.uuid().optional(),
    resourceId: z.uuid(),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(240)
      .regex(/^[a-zA-Z0-9:_-]+$/),
  })
  .strict();

export type DurableTaskPayload = z.infer<typeof durableTaskPayloadSchema>;

export const triggerRetryPolicy = {
  maxAttempts: 3,
  minTimeoutInMs: 2_000,
  maxTimeoutInMs: 30_000,
  factor: 2,
  randomize: true,
} as const;
