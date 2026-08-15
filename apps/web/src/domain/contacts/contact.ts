import type {
  DataFactStatus,
  DataVerificationStatus,
} from "@/domain/lead-data/data-quality";

export type Contact = Readonly<{
  id: string;
  companyId: string | null;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  normalizedName: string;
  email: string | null;
  linkedinUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  seniority: string | null;
  phone: string | null;
  countryCode: string | null;
  factStatus: DataFactStatus;
  confidenceScore: number | null;
  verificationStatus: DataVerificationStatus;
  createdAt: string;
  updatedAt: string;
}>;
