export const permissionKeys = [
  "agency.manage",
  "agency.transfer_ownership",
  "client.read",
  "client.create",
  "client.manage",
  "client.archive",
  "onboarding.read",
  "onboarding.write",
  "onboarding.validate",
  "member.read",
  "member.invite",
  "member.assign_role",
  "member.suspend",
  "role.read",
  "role.create",
  "role.assign",
  "role.archive",
  "offer.read",
  "offer.write",
  "targeting.read",
  "targeting.write",
  "targeting.validate",
  "targeting.propose",
  "campaign.read",
  "campaign.create",
  "campaign.write",
  "campaign.approve",
  "campaign.launch",
  "lead.read",
  "lead.write",
  "message.read",
  "message.write",
  "message.approve",
  "reply.read",
  "reply.write",
  "meeting.read",
  "meeting.write",
  "pipeline.read",
  "pipeline.write",
  "analytics.read",
  "audit.read",
  "settings.read",
  "settings.manage",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

const permissionKeySet: ReadonlySet<string> = new Set(permissionKeys);

export function isPermissionKey(value: string): value is PermissionKey {
  return permissionKeySet.has(value);
}

export type PermissionRequirement = Readonly<{
  allOf?: readonly PermissionKey[];
  anyOf?: readonly PermissionKey[];
}>;
