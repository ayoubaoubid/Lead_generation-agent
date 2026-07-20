import { z } from "zod";

const userActorSchema = z.object({
  kind: z.literal("user"),
  actorId: z.uuid(),
});

const serviceActorSchema = z.object({
  kind: z.literal("service"),
  serviceName: z.string().trim().min(1).max(100),
});

const actorIdentitySchema = z.discriminatedUnion("kind", [
  userActorSchema,
  serviceActorSchema,
]);

const agencyTenantContextSchema = z.object({
  scope: z.literal("agency"),
  agencyId: z.uuid(),
  actor: actorIdentitySchema,
});

const clientTenantContextSchema = z.object({
  scope: z.literal("client"),
  agencyId: z.uuid(),
  clientId: z.uuid(),
  actor: actorIdentitySchema,
});

export const tenantContextSchema = z.discriminatedUnion("scope", [
  agencyTenantContextSchema,
  clientTenantContextSchema,
]);
