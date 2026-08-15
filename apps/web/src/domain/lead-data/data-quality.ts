export const dataFactStatuses = [
  "confirmed",
  "extracted",
  "estimated",
  "hypothesis",
  "unverified",
] as const;

export type DataFactStatus = (typeof dataFactStatuses)[number];

export const dataVerificationStatuses = [
  "unverified",
  "pending",
  "verified",
  "invalid",
  "stale",
] as const;

export type DataVerificationStatus = (typeof dataVerificationStatuses)[number];

export type EntitySource = Readonly<{
  provider: string | null;
  externalId: string | null;
  sourceUrl: string | null;
  collectedAt: string;
  factStatus: DataFactStatus;
  confidenceScore: number | null;
  verificationStatus: DataVerificationStatus;
}>;
