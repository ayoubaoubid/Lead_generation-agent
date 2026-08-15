import { DomainError } from "@/domain/errors/domain-error";
import type {
  EmailVerificationRepository,
  StoredEmailVerification,
} from "@/repositories/contracts/email-verification.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import {
  ProviderError,
  type ProviderContext,
} from "@/services/providers/provider-context";
import type { EmailVerificationProvider } from "@/services/verification/email-verification.provider";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";
import {
  normalizedEmailSchema,
  normalizedEmailVerificationSchema,
  type VerifyContactEmailCommand,
} from "@/validations/verification/email-verification.schema";

export interface EmailVerificationAuthorizer {
  assertCanVerifyContactEmail(
    input: Readonly<{ contactId: string }>,
    context: ServiceContext & { tenant: ClientTenantContext },
  ): Promise<void>;
}

type EmailVerificationServiceDependencies = Readonly<{
  authorizer: EmailVerificationAuthorizer;
  provider: EmailVerificationProvider;
  repository: EmailVerificationRepository;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "tenant_mismatch",
      "Email verification requires an active client workspace.",
    );
  }
}

function repositoryContext(context: ServiceContext): RepositoryContext {
  return {
    tenant: context.tenant,
    correlationId: context.correlationId,
  };
}

function providerContext(
  command: VerifyContactEmailCommand,
  context: ServiceContext & { tenant: ClientTenantContext },
): ProviderContext {
  return {
    agencyId: context.tenant.agencyId,
    clientId: context.tenant.clientId,
    resourceId: command.contactId,
    correlationId: context.correlationId,
    idempotencyKey: command.idempotencyKey,
    ...(context.tenant.actor.kind === "user"
      ? { actorId: context.tenant.actor.actorId }
      : {}),
  };
}

function safeFailureCode(error: unknown): Readonly<{
  code: string;
  retryable: boolean;
}> {
  if (error instanceof ProviderError) {
    return { code: error.code, retryable: error.retryable };
  }
  if (error instanceof DomainError) {
    return { code: error.code, retryable: false };
  }
  return { code: "unknown_provider_error", retryable: false };
}

function mapProviderFailure(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof ProviderError) {
    if (error.code === "rate_limited") {
      return new DomainError(
        "rate_limited",
        "The email verification provider is temporarily rate limited.",
        { cause: error },
      );
    }
    return new DomainError(
      "external_dependency_failed",
      "The email could not be verified at this time.",
      { cause: error },
    );
  }
  return new DomainError(
    "external_dependency_failed",
    "The email verification failed unexpectedly.",
    { cause: error },
  );
}

export class EmailVerificationService {
  constructor(
    private readonly dependencies: EmailVerificationServiceDependencies,
  ) {}

  async verifyContactEmail(
    command: VerifyContactEmailCommand,
    context: ServiceContext,
  ): Promise<StoredEmailVerification> {
    assertClientScope(context);
    await this.dependencies.authorizer.assertCanVerifyContactEmail(
      { contactId: command.contactId },
      context,
    );

    const persistenceContext = repositoryContext(context);
    const contact = await this.dependencies.repository.findContactEmail(
      command.contactId,
      persistenceContext,
    );
    if (!contact) {
      throw new DomainError(
        "resource_not_found",
        "The contact could not be found.",
      );
    }
    if (
      contact.agencyId !== context.tenant.agencyId ||
      contact.clientId !== context.tenant.clientId
    ) {
      throw new DomainError(
        "tenant_mismatch",
        "The contact does not belong to the active client workspace.",
      );
    }

    const emailResult = normalizedEmailSchema.safeParse(contact.email);
    if (!emailResult.success) {
      throw new DomainError(
        "invalid_state",
        "The contact does not have a valid email address to verify.",
        { cause: emailResult.error },
      );
    }
    const email = emailResult.data;

    const reservation = await this.dependencies.repository.reserveVerification(
      {
        contactId: contact.contactId,
        email,
        idempotencyKey: command.idempotencyKey,
      },
      persistenceContext,
    );
    if (reservation.state === "completed") {
      return reservation.verification;
    }
    if (reservation.state === "in_progress") {
      throw new DomainError(
        "conflict",
        "This email verification is already in progress.",
      );
    }

    try {
      const providerResult = await this.dependencies.provider.verifyEmail(
        providerContext(command, context),
        {
          contactId: contact.contactId,
          email,
        },
      );
      const parsedResult = normalizedEmailVerificationSchema.safeParse(
        providerResult.data,
      );
      if (!parsedResult.success) {
        throw new ProviderError(
          "invalid_response",
          "The provider returned an invalid email verification result.",
          false,
          undefined,
          parsedResult.error,
        );
      }

      const verification: StoredEmailVerification = {
        verificationId: reservation.verificationId,
        contactId: contact.contactId,
        email,
        idempotencyKey: command.idempotencyKey,
        provider: providerResult.provider,
        providerRequestId: providerResult.providerRequestId ?? null,
        result: parsedResult.data,
        observedAt: providerResult.observedAt,
        cost: providerResult.cost,
        usage: providerResult.usage,
        warnings: providerResult.warnings,
        sanitizedRawResult: providerResult.sanitizedRawResult,
      };
      await this.dependencies.repository.completeVerification(
        verification,
        persistenceContext,
      );

      context.logger.info("Contact email verification completed.", {
        operation: "verification.email.verify",
        correlationId: context.correlationId,
        agencyId: context.tenant.agencyId,
        clientId: context.tenant.clientId,
        actor: context.tenant.actor,
        resourceType: "contact",
        resourceId: contact.contactId,
        attributes: {
          provider: providerResult.provider,
          status: parsedResult.data.status,
        },
      });
      return verification;
    } catch (error) {
      const failure = safeFailureCode(error);
      await this.dependencies.repository.failVerification(
        {
          verificationId: reservation.verificationId,
          errorCode: failure.code,
          isRetryable: failure.retryable,
        },
        persistenceContext,
      );
      context.logger.error(
        "Contact email verification failed.",
        {
          name: error instanceof Error ? error.name : "UnknownError",
          code: failure.code,
          message: "Email verification failed without logging the address.",
        },
        {
          operation: "verification.email.verify",
          correlationId: context.correlationId,
          agencyId: context.tenant.agencyId,
          clientId: context.tenant.clientId,
          actor: context.tenant.actor,
          resourceType: "contact",
          resourceId: contact.contactId,
        },
      );
      throw mapProviderFailure(error);
    }
  }
}
