import { z } from "zod";

const workspaceSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const createAgencySchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: workspaceSlugSchema,
});

export const selectAgencySchema = z.object({
  agencyId: z.uuid(),
});

export const selectClientSchema = z.object({
  clientId: z.uuid(),
});

export const acceptAgencyMembershipSchema = z.object({
  membershipId: z.uuid(),
});

export const createClientSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: workspaceSlugSchema,
});

export const assignAgencyMemberSchema = z.object({
  profileId: z.uuid(),
  roleId: z.uuid(),
});

export const assignClientMemberSchema = z.object({
  clientId: z.uuid(),
  profileId: z.uuid(),
  roleId: z.uuid(),
});

export const inviteRecruiterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  clientIds: z.array(z.uuid()).max(100),
});

export const assignRecruiterClientsSchema = z.object({
  profileId: z.uuid(),
  clientIds: z.array(z.uuid()).min(1).max(100),
});
