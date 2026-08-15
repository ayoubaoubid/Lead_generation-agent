import type {
  CompanyEnrichmentInput,
  CompanyEnrichmentProvider,
  ContactEnrichmentInput,
  ContactEnrichmentProvider,
  DomainValidationInput,
  DomainValidationProvider,
} from "@/services/enrichment/enrichment.provider";
import type {
  ProviderContext,
  ProviderResult,
} from "@/services/providers/provider-context";
import type {
  CompanyEnrichmentResult,
  ContactEnrichmentResult,
  DomainValidationResult,
} from "@/validations/enrichment/enrichment.schema";

const providerId = "development-mock";

function now(): string {
  return new Date().toISOString();
}

function developmentEnvelope<T>(
  data: T,
  operation: string,
  rawResult: Readonly<Record<string, string | boolean | null>>,
): ProviderResult<T> {
  return {
    data,
    provider: providerId,
    observedAt: now(),
    usage: [{ operation, quantity: 1, unit: "development_request" }],
    cost: { amount: 0, currency: "USD" },
    warnings: [
      {
        code: "development_only",
        message: "Development provider: no external enrichment was performed.",
      },
    ],
    sanitizedRawResult: rawResult,
  };
}

export class DevelopmentEnrichmentProvider
  implements
    CompanyEnrichmentProvider,
    ContactEnrichmentProvider,
    DomainValidationProvider
{
  readonly providerId = providerId;

  async enrichCompany(
    _context: ProviderContext,
    input: CompanyEnrichmentInput,
  ): Promise<ProviderResult<CompanyEnrichmentResult>> {
    return developmentEnvelope(
      {
        legalName: input.name,
        domain: input.domain,
        websiteUrl: input.websiteUrl,
        industry: null,
        countryCode: null,
        employeeCount: null,
        annualRevenue: null,
        revenueCurrency: null,
        technologies: [],
        confidenceScore: null,
        source: providerId,
      },
      "company_enrichment",
      {
        mode: "passthrough",
        companyId: input.companyId,
        hadDomain: input.domain !== null,
      },
    );
  }

  async enrichContact(
    _context: ProviderContext,
    input: ContactEnrichmentInput,
  ): Promise<ProviderResult<ContactEnrichmentResult>> {
    return developmentEnvelope(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: input.fullName,
        jobTitle: null,
        department: null,
        seniority: null,
        linkedinUrl: input.linkedinUrl,
        phone: null,
        countryCode: null,
        confidenceScore: null,
        source: providerId,
      },
      "contact_enrichment",
      {
        mode: "passthrough",
        contactId: input.contactId,
        hadEmail: input.email !== null,
      },
    );
  }

  async validateDomain(
    _context: ProviderContext,
    input: DomainValidationInput,
  ): Promise<ProviderResult<DomainValidationResult>> {
    const syntacticallyValid =
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/u.test(
        input.domain,
      );
    return developmentEnvelope(
      {
        domain: input.domain,
        status: syntacticallyValid ? "unknown" : "invalid",
        hasMxRecords: null,
        acceptsEmail: null,
        isDisposable: null,
        confidenceScore: syntacticallyValid ? null : 100,
        source: providerId,
      },
      "domain_validation",
      {
        mode: "syntax_only",
        domain: input.domain,
        syntacticallyValid,
      },
    );
  }
}
