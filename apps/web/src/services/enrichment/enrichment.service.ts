import { createHash } from "node:crypto";

import { DomainError } from "@/domain/errors/domain-error";
import type { ProviderOperationKind } from "@/domain/enrichment/provider-operation";
import type {
  ProviderOperationRepository,
  StoredProviderOperation,
} from "@/repositories/contracts/provider-operation.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import type {
  CompanyEnrichmentProvider,
  ContactEnrichmentProvider,
  DomainValidationProvider,
} from "@/services/enrichment/enrichment.provider";
import {
  ProviderError,
  type ProviderContext,
  type ProviderResult,
} from "@/services/providers/provider-context";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";
import {
  companyEnrichmentResultSchema,
  contactEnrichmentResultSchema,
  domainValidationResultSchema,
  type CompanyEnrichmentResult,
  type ContactEnrichmentResult,
  type DomainValidationResult,
  type EnrichCompanyCommand,
  type EnrichContactCommand,
  type ValidateDomainCommand,
} from "@/validations/enrichment/enrichment.schema";

export interface ProviderOperationAuthorizer {
  assertCanRunProviderOperation(
    input: Readonly<{
      operationKind: ProviderOperationKind;
      resourceId: string;
    }>,
    context: ServiceContext & { tenant: ClientTenantContext },
  ): Promise<void>;
}

type EnrichmentServiceDependencies = Readonly<{
  authorizer: ProviderOperationAuthorizer;
  companyProvider: CompanyEnrichmentProvider;
  contactProvider: ContactEnrichmentProvider;
  domainProvider: DomainValidationProvider;
  repository: ProviderOperationRepository;
}>;

export type ProviderOperationOutcome<T> = Readonly<{
  operationId: string;
  operationKind: ProviderOperationKind;
  provider: string;
  result: T;
  costAmount: number;
  costCurrency: string;
  observedAt: string;
  reused: boolean;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "tenant_mismatch",
      "Provider operations require an active client workspace.",
    );
  }
}

function persistenceContext(context: ServiceContext): RepositoryContext {
  return {
    tenant: context.tenant,
    correlationId: context.correlationId,
  };
}

function assertTargetTenant(
  target: Readonly<{ agencyId: string; clientId: string }>,
  tenant: ClientTenantContext,
): void {
  if (
    target.agencyId !== tenant.agencyId ||
    target.clientId !== tenant.clientId
  ) {
    throw new DomainError(
      "tenant_mismatch",
      "The provider operation target does not belong to the active client.",
    );
  }
}

function fingerprint(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//u, "")
    .replace(/^www\./u, "")
    .replace(/[/#:?].*$/u, "");
}

function providerContext(
  context: ServiceContext & { tenant: ClientTenantContext },
  resourceId: string,
  idempotencyKey: string,
): ProviderContext {
  return {
    agencyId: context.tenant.agencyId,
    clientId: context.tenant.clientId,
    resourceId,
    correlationId: context.correlationId,
    idempotencyKey,
    ...(context.tenant.actor.kind === "user"
      ? { actorId: context.tenant.actor.actorId }
      : {}),
  };
}

function operationFromResult<T>(
  operationId: string,
  operationKind: ProviderOperationKind,
  result: ProviderResult<T>,
  confidenceScore: number | null,
  source: string | null,
): StoredProviderOperation {
  return {
    operationId,
    operationKind,
    provider: result.provider,
    normalizedResult: result.data,
    sanitizedRawResult: result.sanitizedRawResult,
    confidenceScore,
    source,
    sourceUrl: null,
    cost: result.cost,
    usage: result.usage,
    warnings: result.warnings,
    observedAt: result.observedAt,
  };
}

function mapFailure(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof ProviderError && error.code === "rate_limited") {
    return new DomainError(
      "rate_limited",
      "The provider is temporarily rate limited.",
      { cause: error },
    );
  }
  return new DomainError(
    "external_dependency_failed",
    "The provider operation could not be completed.",
    { cause: error },
  );
}

function failureMetadata(error: unknown): Readonly<{
  code: string;
  retryable: boolean;
}> {
  return error instanceof ProviderError
    ? { code: error.code, retryable: error.retryable }
    : { code: "unexpected_provider_error", retryable: false };
}

export class EnrichmentService {
  constructor(private readonly dependencies: EnrichmentServiceDependencies) {}

  async enrichCompany(
    command: EnrichCompanyCommand,
    context: ServiceContext,
  ): Promise<ProviderOperationOutcome<CompanyEnrichmentResult>> {
    assertClientScope(context);
    await this.dependencies.authorizer.assertCanRunProviderOperation(
      {
        operationKind: "company_enrichment",
        resourceId: command.companyId,
      },
      context,
    );
    const repositoryContext = persistenceContext(context);
    const company = await this.dependencies.repository.findCompany(
      command.companyId,
      repositoryContext,
    );
    if (!company) {
      throw new DomainError("resource_not_found", "Company not found.");
    }
    assertTargetTenant(company, context.tenant);
    const input = {
      companyId: company.companyId,
      name: company.name,
      domain: company.domain,
      websiteUrl: company.websiteUrl,
    };
    return this.execute(
      {
        operationKind: "company_enrichment",
        provider: this.dependencies.companyProvider.providerId,
        companyId: company.companyId,
        contactId: null,
        requestedDomain: null,
        idempotencyKey: command.idempotencyKey,
        inputFingerprint: fingerprint(input),
        resourceId: company.companyId,
        schema: companyEnrichmentResultSchema,
        invoke: () =>
          this.dependencies.companyProvider.enrichCompany(
            providerContext(context, company.companyId, command.idempotencyKey),
            input,
          ),
      },
      context,
    );
  }

  async enrichContact(
    command: EnrichContactCommand,
    context: ServiceContext,
  ): Promise<ProviderOperationOutcome<ContactEnrichmentResult>> {
    assertClientScope(context);
    await this.dependencies.authorizer.assertCanRunProviderOperation(
      {
        operationKind: "contact_enrichment",
        resourceId: command.contactId,
      },
      context,
    );
    const repositoryContext = persistenceContext(context);
    const contact = await this.dependencies.repository.findContact(
      command.contactId,
      repositoryContext,
    );
    if (!contact) {
      throw new DomainError("resource_not_found", "Contact not found.");
    }
    assertTargetTenant(contact, context.tenant);
    const input = {
      contactId: contact.contactId,
      companyId: contact.companyId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      email: contact.email,
      linkedinUrl: contact.linkedinUrl,
    };
    return this.execute(
      {
        operationKind: "contact_enrichment",
        provider: this.dependencies.contactProvider.providerId,
        companyId: null,
        contactId: contact.contactId,
        requestedDomain: null,
        idempotencyKey: command.idempotencyKey,
        inputFingerprint: fingerprint(input),
        resourceId: contact.contactId,
        schema: contactEnrichmentResultSchema,
        invoke: () =>
          this.dependencies.contactProvider.enrichContact(
            providerContext(context, contact.contactId, command.idempotencyKey),
            input,
          ),
      },
      context,
    );
  }

  async validateDomain(
    command: ValidateDomainCommand,
    context: ServiceContext,
  ): Promise<ProviderOperationOutcome<DomainValidationResult>> {
    assertClientScope(context);
    const domain = normalizeDomain(command.domain);
    if (!domain) {
      throw new DomainError("validation_failed", "A domain is required.");
    }
    if (command.companyId) {
      const company = await this.dependencies.repository.findCompany(
        command.companyId,
        persistenceContext(context),
      );
      if (!company) {
        throw new DomainError("resource_not_found", "Company not found.");
      }
      assertTargetTenant(company, context.tenant);
    }
    await this.dependencies.authorizer.assertCanRunProviderOperation(
      {
        operationKind: "domain_validation",
        resourceId: command.companyId ?? domain,
      },
      context,
    );
    const input = { companyId: command.companyId, domain };
    return this.execute(
      {
        operationKind: "domain_validation",
        provider: this.dependencies.domainProvider.providerId,
        companyId: command.companyId,
        contactId: null,
        requestedDomain: domain,
        idempotencyKey: command.idempotencyKey,
        inputFingerprint: fingerprint(input),
        resourceId: command.companyId ?? domain,
        schema: domainValidationResultSchema,
        invoke: () =>
          this.dependencies.domainProvider.validateDomain(
            providerContext(
              context,
              command.companyId ?? domain,
              command.idempotencyKey,
            ),
            input,
          ),
      },
      context,
    );
  }

  private async execute<T>(
    specification: Readonly<{
      operationKind: ProviderOperationKind;
      provider: string;
      companyId: string | null;
      contactId: string | null;
      requestedDomain: string | null;
      idempotencyKey: string;
      inputFingerprint: string;
      resourceId: string;
      schema: {
        safeParse(
          input: unknown,
        ): { success: true; data: T } | { success: false };
      };
      invoke: () => Promise<ProviderResult<T>>;
    }>,
    context: ServiceContext & { tenant: ClientTenantContext },
  ): Promise<ProviderOperationOutcome<T>> {
    const repositoryContext = persistenceContext(context);
    const reservation = await this.dependencies.repository.reserve(
      {
        operationKind: specification.operationKind,
        provider: specification.provider,
        companyId: specification.companyId,
        contactId: specification.contactId,
        requestedDomain: specification.requestedDomain,
        idempotencyKey: specification.idempotencyKey,
        inputFingerprint: specification.inputFingerprint,
      },
      repositoryContext,
    );
    if (reservation.state === "in_progress") {
      throw new DomainError(
        "conflict",
        "This provider operation is already running.",
      );
    }
    if (reservation.state === "completed") {
      const parsed = specification.schema.safeParse(
        reservation.operation.normalizedResult,
      );
      if (!parsed.success) {
        throw new DomainError(
          "invalid_state",
          "The stored provider result is invalid.",
        );
      }
      return {
        operationId: reservation.operation.operationId,
        operationKind: specification.operationKind,
        provider: reservation.operation.provider,
        result: parsed.data,
        costAmount: reservation.operation.cost.amount,
        costCurrency: reservation.operation.cost.currency,
        observedAt: reservation.operation.observedAt,
        reused: true,
      };
    }

    try {
      const providerResult = await specification.invoke();
      const parsed = specification.schema.safeParse(providerResult.data);
      if (!parsed.success) {
        throw new ProviderError(
          "invalid_response",
          "The provider result failed validation.",
          false,
        );
      }
      const confidenceScore =
        "confidenceScore" in Object(parsed.data)
          ? ((parsed.data as { confidenceScore?: number | null })
              .confidenceScore ?? null)
          : null;
      const source =
        "source" in Object(parsed.data)
          ? ((parsed.data as { source?: string }).source ?? null)
          : null;
      const operation = operationFromResult(
        reservation.operationId,
        specification.operationKind,
        { ...providerResult, data: parsed.data },
        confidenceScore,
        source,
      );
      await this.dependencies.repository.complete(operation, repositoryContext);
      context.logger.info("Provider operation completed.", {
        operation: `provider.${specification.operationKind}`,
        correlationId: context.correlationId,
        agencyId: context.tenant.agencyId,
        clientId: context.tenant.clientId,
        actor: context.tenant.actor,
        resourceType: specification.operationKind,
        resourceId: specification.resourceId,
        attributes: {
          provider: providerResult.provider,
          costAmount: providerResult.cost.amount,
          costCurrency: providerResult.cost.currency,
        },
      });
      return {
        operationId: operation.operationId,
        operationKind: specification.operationKind,
        provider: operation.provider,
        result: parsed.data,
        costAmount: operation.cost.amount,
        costCurrency: operation.cost.currency,
        observedAt: operation.observedAt,
        reused: false,
      };
    } catch (error) {
      const failure = failureMetadata(error);
      await this.dependencies.repository.fail(
        {
          operationId: reservation.operationId,
          errorCode: failure.code,
          errorMessageRedacted: "Provider operation failed.",
          isRetryable: failure.retryable,
        },
        repositoryContext,
      );
      throw mapFailure(error);
    }
  }
}
