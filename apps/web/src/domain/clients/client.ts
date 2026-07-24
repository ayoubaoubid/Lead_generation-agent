export const clientStatuses = [
  "draft",
  "onboarding",
  "active",
  "paused",
  "archived",
] as const;

export type ClientStatus = (typeof clientStatuses)[number];
export type EditableClientStatus = Exclude<ClientStatus, "archived">;

export type ClientProfile = Readonly<{
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  status: ClientStatus;
  legalName: string | null;
  websiteUrl: string | null;
  industry: string | null;
  countryCode: string | null;
  languageCode: string | null;
  timezone: string | null;
  description: string | null;
  logoUrl: string | null;
  objectives: readonly string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
}>;

export type ClientListItem = Pick<
  ClientProfile,
  | "countryCode"
  | "id"
  | "industry"
  | "languageCode"
  | "logoUrl"
  | "name"
  | "slug"
  | "status"
  | "updatedAt"
  | "websiteUrl"
>;

export type ClientMember = Readonly<{
  id: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  roleId: string;
  roleName: string;
  status: "invited" | "active" | "suspended" | "removed";
}>;

export type ClientRoleOption = Readonly<{
  id: string;
  name: string;
}>;

export type AgencyMemberOption = Readonly<{
  profileId: string;
  displayName: string;
}>;
