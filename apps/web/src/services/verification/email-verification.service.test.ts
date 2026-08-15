import { describe, expect, it, vi } from "vitest";

import type { Logger } from "@/lib/logging/logger";
import type {
  EmailVerificationReservation,
  EmailVerificationRepository,
  StoredEmailVerification,
} from "@/repositories/contracts/email-verification.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import { ProviderError } from "@/services/providers/provider-context";
import type { ServiceContext } from "@/services/service-context";

import type { EmailVerificationProvider } from "./email-verification.provider";
import {
  EmailVerificationService,
  type EmailVerificationAuthorizer,
} from "./email-verification.service";

const agencyId = "a0000000-0000-4000-8000-000000000001";
const clientId = "c0000000-0000-4000-8000-000000000001";
const otherClientId = "c0000000-0000-4000-8000-000000000002";
const actorId = "10000000-0000-4000-8000-000000000001";
const contactId = "20000000-0000-4000-8000-000000000001";
const verificationId = "40000000-0000-4000-8000-000000000001";
const checkedAt = "2026-07-26T12:00:00.000Z";

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
  correlationId: "verification-test",
  logger,
};

const providerResponse = {
  data: {
    status: "valid" as const,
    providerStatus: "valid",
    providerSubStatus: null,
    checkedAt,
    expiresAt: null,
    confidenceScore: 98,
  },
  provider: "provider-test",
  providerRequestId: "provider-request-1",
  observedAt: checkedAt,
  cost: { amount: 0.01, currency: "USD" },
  usage: [{ operation: "email_verification", quantity: 1, unit: "request" }],
  warnings: [],
  sanitizedRawResult: { status: "valid" },
};

class AuthorizerFake implements EmailVerificationAuthorizer {
  readonly assertSpy = vi.fn(
    async (
      _input: Parameters<
        EmailVerificationAuthorizer["assertCanVerifyContactEmail"]
      >[0],
      _context: Parameters<
        EmailVerificationAuthorizer["assertCanVerifyContactEmail"]
      >[1],
    ) => {
      void _input;
      void _context;
    },
  );

  async assertCanVerifyContactEmail(
    input: Parameters<
      EmailVerificationAuthorizer["assertCanVerifyContactEmail"]
    >[0],
    serviceContext: Parameters<
      EmailVerificationAuthorizer["assertCanVerifyContactEmail"]
    >[1],
  ): Promise<void> {
    return this.assertSpy(input, serviceContext);
  }
}

class EmailVerificationRepositoryFake implements EmailVerificationRepository {
  contact = {
    contactId,
    agencyId,
    clientId,
    email: " Recruiter@Example.COM ",
  };
  reservation: EmailVerificationReservation | undefined = {
    state: "reserved",
    verificationId,
  };
  readonly findSpy = vi.fn(
    async (requestedContactId: string, persistence: RepositoryContext) => {
      void requestedContactId;
      void persistence;
      return this.contact;
    },
  );
  readonly reserveSpy = vi.fn(
    async (
      input: Parameters<EmailVerificationRepository["reserveVerification"]>[0],
      persistence: RepositoryContext,
    ) => {
      void input;
      void persistence;
      return (
        this.reservation ??
        ({
          state: "reserved",
          verificationId,
        } satisfies EmailVerificationReservation)
      );
    },
  );
  readonly completeSpy = vi.fn(
    async (
      _input: StoredEmailVerification,
      _persistence: RepositoryContext,
    ) => {
      void _input;
      void _persistence;
    },
  );
  readonly failSpy = vi.fn(
    async (
      _input: Parameters<EmailVerificationRepository["failVerification"]>[0],
      _persistence: RepositoryContext,
    ) => {
      void _input;
      void _persistence;
    },
  );

  async findContactEmail(
    requestedContactId: string,
    persistence: RepositoryContext,
  ) {
    return this.findSpy(requestedContactId, persistence);
  }

  async reserveVerification(
    input: Parameters<EmailVerificationRepository["reserveVerification"]>[0],
    persistence: RepositoryContext,
  ) {
    return this.reserveSpy(input, persistence);
  }

  async completeVerification(
    input: StoredEmailVerification,
    persistence: RepositoryContext,
  ): Promise<void> {
    return this.completeSpy(input, persistence);
  }

  async failVerification(
    input: Parameters<EmailVerificationRepository["failVerification"]>[0],
    persistence: RepositoryContext,
  ): Promise<void> {
    return this.failSpy(input, persistence);
  }
}

class EmailVerificationProviderFake implements EmailVerificationProvider {
  readonly verifySpy = vi.fn(
    async (
      _providerContext: Parameters<EmailVerificationProvider["verifyEmail"]>[0],
      _input: Parameters<EmailVerificationProvider["verifyEmail"]>[1],
    ) => {
      void _providerContext;
      void _input;
      return providerResponse;
    },
  );

  async verifyEmail(
    providerContext: Parameters<EmailVerificationProvider["verifyEmail"]>[0],
    input: Parameters<EmailVerificationProvider["verifyEmail"]>[1],
  ) {
    return this.verifySpy(providerContext, input);
  }
}

function command() {
  return {
    contactId,
    idempotencyKey: "verify:contact-1",
  } as const;
}

describe("EmailVerificationService", () => {
  it("reloads and normalizes the email instead of accepting it from the caller", async () => {
    const repository = new EmailVerificationRepositoryFake();
    const provider = new EmailVerificationProviderFake();
    const service = new EmailVerificationService({
      repository,
      provider,
      authorizer: new AuthorizerFake(),
    });

    await service.verifyContactEmail(command(), context);

    expect(provider.verifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId,
        clientId,
        resourceId: contactId,
        actorId,
        idempotencyKey: "verify:contact-1",
      }),
      { contactId, email: "recruiter@example.com" },
    );
    expect(repository.reserveSpy).toHaveBeenCalledWith(
      {
        contactId,
        email: "recruiter@example.com",
        idempotencyKey: "verify:contact-1",
      },
      expect.any(Object),
    );
    expect(repository.completeSpy).toHaveBeenCalledOnce();
  });

  it("returns a completed idempotent reservation without another provider call", async () => {
    const repository = new EmailVerificationRepositoryFake();
    const existing: StoredEmailVerification = {
      verificationId,
      contactId,
      email: "recruiter@example.com",
      idempotencyKey: "verify:contact-1",
      provider: "provider-test",
      providerRequestId: "provider-request-1",
      result: providerResponse.data,
      observedAt: checkedAt,
      cost: providerResponse.cost,
      usage: providerResponse.usage,
      warnings: [],
      sanitizedRawResult: providerResponse.sanitizedRawResult,
    };
    repository.reservation = { state: "completed", verification: existing };
    const provider = new EmailVerificationProviderFake();
    const service = new EmailVerificationService({
      repository,
      provider,
      authorizer: new AuthorizerFake(),
    });

    await expect(
      service.verifyContactEmail(command(), context),
    ).resolves.toEqual(existing);
    expect(provider.verifySpy).not.toHaveBeenCalled();
  });

  it("rejects a contact reloaded from another client", async () => {
    const repository = new EmailVerificationRepositoryFake();
    repository.contact = { ...repository.contact, clientId: otherClientId };
    const provider = new EmailVerificationProviderFake();
    const service = new EmailVerificationService({
      repository,
      provider,
      authorizer: new AuthorizerFake(),
    });

    await expect(
      service.verifyContactEmail(command(), context),
    ).rejects.toMatchObject({ code: "tenant_mismatch" });
    expect(repository.reserveSpy).not.toHaveBeenCalled();
    expect(provider.verifySpy).not.toHaveBeenCalled();
  });

  it("fails closed and records a retryable provider error", async () => {
    const repository = new EmailVerificationRepositoryFake();
    const provider = new EmailVerificationProviderFake();
    provider.verifySpy.mockRejectedValueOnce(
      new ProviderError("rate_limited", "Too many requests", true, 10_000),
    );
    const service = new EmailVerificationService({
      repository,
      provider,
      authorizer: new AuthorizerFake(),
    });

    await expect(
      service.verifyContactEmail(command(), context),
    ).rejects.toMatchObject({ code: "rate_limited" });
    expect(repository.failSpy).toHaveBeenCalledWith(
      {
        verificationId,
        errorCode: "rate_limited",
        isRetryable: true,
      },
      expect.any(Object),
    );
  });
});
