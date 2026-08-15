import type {
  DataFactStatus,
  DataVerificationStatus,
} from "@/domain/lead-data/data-quality";

export type Company = Readonly<{
  id: string;
  name: string;
  normalizedName: string;
  domain: string | null;
  websiteUrl: string | null;
  industry: string | null;
  countryCode: string | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  revenueCurrency: string | null;
  technologies: readonly string[];
  description: string | null;
  factStatus: DataFactStatus;
  confidenceScore: number | null;
  verificationStatus: DataVerificationStatus;
  createdAt: string;
  updatedAt: string;
}>;
