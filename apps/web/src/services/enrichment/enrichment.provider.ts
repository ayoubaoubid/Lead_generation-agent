import type {
  ProviderContext,
  ProviderResult,
} from "@/services/providers/provider-context";
import type {
  CompanyEnrichmentResult,
  ContactEnrichmentResult,
  DomainValidationResult,
} from "@/validations/enrichment/enrichment.schema";

export type CompanyEnrichmentInput = Readonly<{
  companyId: string;
  name: string;
  domain: string | null;
  websiteUrl: string | null;
}>;

export type ContactEnrichmentInput = Readonly<{
  contactId: string;
  companyId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  linkedinUrl: string | null;
}>;

export type DomainValidationInput = Readonly<{
  companyId: string | null;
  domain: string;
}>;

export interface CompanyEnrichmentProvider {
  readonly providerId: string;
  enrichCompany(
    context: ProviderContext,
    input: CompanyEnrichmentInput,
  ): Promise<ProviderResult<CompanyEnrichmentResult>>;
}

export interface ContactEnrichmentProvider {
  readonly providerId: string;
  enrichContact(
    context: ProviderContext,
    input: ContactEnrichmentInput,
  ): Promise<ProviderResult<ContactEnrichmentResult>>;
}

export interface DomainValidationProvider {
  readonly providerId: string;
  validateDomain(
    context: ProviderContext,
    input: DomainValidationInput,
  ): Promise<ProviderResult<DomainValidationResult>>;
}
