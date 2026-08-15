import { describe, expect, it, vi } from "vitest";

import type { Logger } from "@/lib/logging/logger";
import type {
  ProviderOperationRepository,
  StoredProviderOperation,
} from "@/repositories/contracts/provider-operation.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { DevelopmentEnrichmentProvider } from "@/services/enrichment/development-enrichment.provider";
import type { ProviderOperationAuthorizer } from "@/services/enrichment/enrichment.service";
import { EnrichmentService } from "@/services/enrichment/enrichment.service";
import type { ServiceContext } from "@/services/service-context";

const agencyId = "a0000000-0000-4000-8000-000000000001";
const clientId = "c0000000-0000-4000-8000-000000000001";
const otherClientId = "c0000000-0000-4000-8000-000000000002";
const actorId = "10000000-0000-4000-8000-000000000001";
const companyId = "20000000-0000-4000-8000-000000000001";
const contactId = "30000000-0000-4000-8000-000000000001";
const operationId = "40000000-0000-4000-8000-000000000001";

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const context: ServiceContext = {
  tenant: {
    scope: "client",
    agencyId,
    clientId,
    actor: { kind: "user", actorId },
  },
  correlationId: "enrichment-test",
  logger,
};

class AuthorizerFake implements ProviderOperationAuthorizer {
  readonly spy = vi.fn(
    async (
      input: Parameters<
        ProviderOperationAuthorizer["assertCanRunProviderOperation"]
      >[0],
      serviceContext: Parameters<
        ProviderOperationAuthorizer["assertCanRunProviderOperation"]
      >[1],
    ) => {
      void input;
      void serviceContext;
    },
  );

  async assertCanRunProviderOperation(
    input: Parameters<
      ProviderOperationAuthorizer["assertCanRunProviderOperation"]
    >[0],
    serviceContext: Parameters<
      ProviderOperationAuthorizer["assertCanRunProviderOperation"]
    >[1],
  ): Promise<void> {
    return this.spy(input, serviceContext);
  }
}

class ProviderOperationRepositoryFake implements ProviderOperationRepository {
  company = {
    companyId,
    agencyId,
    clientId,
    name: "Acme",
    domain: "acme.example",
    websiteUrl: "https://acme.example",
  };
  contact = {
    contactId,
    agencyId,
    clientId,
    companyId,
    firstName: "Ada",
    lastName: "Lovelace",
    fullName: "Ada Lovelace",
    email: "ada@acme.example",
    linkedinUrl: null,
  };
  reservation:
    Awaited<ReturnType<ProviderOperationRepository["reserve"]>> | undefined = {
    state: "reserved",
    operationId,
  };
  readonly reserveSpy = vi.fn(
    async (
      input: Parameters<ProviderOperationRepository["reserve"]>[0],
      repositoryContext: RepositoryContext,
    ) => {
      void input;
      void repositoryContext;
      return this.reservation ?? ({ state: "reserved", operationId } as const);
    },
  );
  readonly completeSpy = vi.fn(
    async (
      input: StoredProviderOperation,
      repositoryContext: RepositoryContext,
    ) => {
      void input;
      void repositoryContext;
    },
  );
  readonly failSpy = vi.fn(
    async (
      input: Parameters<ProviderOperationRepository["fail"]>[0],
      repositoryContext: RepositoryContext,
    ) => {
      void input;
      void repositoryContext;
    },
  );

  async findCompany(
    requestedCompanyId: string,
    repositoryContext: RepositoryContext,
  ) {
    void repositoryContext;
    return requestedCompanyId === companyId ? this.company : null;
  }

  async findContact(
    requestedContactId: string,
    repositoryContext: RepositoryContext,
  ) {
    void repositoryContext;
    return requestedContactId === contactId ? this.contact : null;
  }

  async reserve(
    input: Parameters<ProviderOperationRepository["reserve"]>[0],
    repositoryContext: RepositoryContext,
  ) {
    return this.reserveSpy(input, repositoryContext);
  }

  async complete(
    input: StoredProviderOperation,
    repositoryContext: RepositoryContext,
  ): Promise<void> {
    return this.completeSpy(input, repositoryContext);
  }

  async fail(
    input: Parameters<ProviderOperationRepository["fail"]>[0],
    repositoryContext: RepositoryContext,
  ): Promise<void> {
    return this.failSpy(input, repositoryContext);
  }
}

function createService(repository: ProviderOperationRepositoryFake) {
  const provider = new DevelopmentEnrichmentProvider();
  return new EnrichmentService({
    authorizer: new AuthorizerFake(),
    companyProvider: provider,
    contactProvider: provider,
    domainProvider: provider,
    repository,
  });
}

describe("EnrichmentService", () => {
  it("reloads the company from the verified tenant and records a provider operation", async () => {
    const repository = new ProviderOperationRepositoryFake();
    const service = createService(repository);

    const result = await service.enrichCompany(
      {
        companyId,
        idempotencyKey: "enrich:company:acme",
      },
      context,
    );

    expect(result).toMatchObject({
      operationId,
      provider: "development-mock",
      costAmount: 0,
      reused: false,
      result: {
        legalName: "Acme",
        domain: "acme.example",
        source: "development-mock",
      },
    });
    expect(repository.reserveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operationKind: "company_enrichment",
        companyId,
        contactId: null,
        inputFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/u),
      }),
      expect.objectContaining({
        tenant: expect.objectContaining({ agencyId, clientId }),
      }),
    );
    expect(repository.completeSpy).toHaveBeenCalledOnce();
  });

  it("rejects a cross-client resource before reserving provider consumption", async () => {
    const repository = new ProviderOperationRepositoryFake();
    repository.company = { ...repository.company, clientId: otherClientId };
    const service = createService(repository);

    await expect(
      service.enrichCompany(
        {
          companyId,
          idempotencyKey: "enrich:company:forged",
        },
        context,
      ),
    ).rejects.toMatchObject({ code: "tenant_mismatch" });
    expect(repository.reserveSpy).not.toHaveBeenCalled();
  });

  it("reuses a completed idempotent operation without provider consumption", async () => {
    const repository = new ProviderOperationRepositoryFake();
    repository.reservation = {
      state: "completed",
      operation: {
        operationId,
        operationKind: "company_enrichment",
        provider: "development-mock",
        normalizedResult: {
          legalName: "Acme",
          domain: "acme.example",
          websiteUrl: "https://acme.example",
          industry: null,
          countryCode: null,
          employeeCount: null,
          annualRevenue: null,
          revenueCurrency: null,
          technologies: [],
          confidenceScore: null,
          source: "development-mock",
        },
        sanitizedRawResult: { mode: "passthrough" },
        confidenceScore: null,
        source: "development-mock",
        sourceUrl: null,
        cost: { amount: 0, currency: "USD" },
        usage: [],
        warnings: [],
        observedAt: "2026-07-26T12:00:00.000Z",
      },
    };
    const service = createService(repository);

    await expect(
      service.enrichCompany(
        {
          companyId,
          idempotencyKey: "enrich:company:acme",
        },
        context,
      ),
    ).resolves.toMatchObject({ reused: true, operationId });
    expect(repository.completeSpy).not.toHaveBeenCalled();
  });

  it("normalizes a domain and never claims DNS validation in development", async () => {
    const repository = new ProviderOperationRepositoryFake();
    const service = createService(repository);

    const result = await service.validateDomain(
      {
        companyId,
        domain: "HTTPS://WWW.Acme.Example/path",
        idempotencyKey: "validate:domain:acme",
      },
      context,
    );

    expect(result.result).toMatchObject({
      domain: "acme.example",
      status: "unknown",
      hasMxRecords: null,
      acceptsEmail: null,
    });
  });
});
