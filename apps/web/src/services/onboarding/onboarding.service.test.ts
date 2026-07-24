import { describe, expect, it, vi } from "vitest";

import type { Logger } from "@/lib/logging/logger";
import type { PermissionKey } from "@/domain/members/permission";
import type {
  OnboardingRepository,
  SaveOnboardingStepRecord,
} from "@/repositories/contracts/onboarding.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import type { ServiceContext } from "@/services/service-context";

import { OnboardingService } from "./onboarding.service";

const agencyId = "a0000000-0000-0000-0000-000000000001";
const clientId = "c0000000-0000-0000-0000-000000000001";
const actorId = "10000000-0000-0000-0000-000000000001";

class PermissionRepository implements TenantAccessRepository {
  constructor(private readonly granted: ReadonlySet<PermissionKey>) {}

  async hasActiveAgencyMembership() {
    return true;
  }

  async canAccessClient() {
    return true;
  }

  async hasPermission(
    _actorId: string,
    _agencyId: string,
    _clientId: string | null,
    permission: PermissionKey,
  ) {
    return this.granted.has(permission);
  }

  async listPermissions() {
    return [...this.granted];
  }
}

class OnboardingRepositoryFake implements OnboardingRepository {
  readonly saveSpy = vi.fn(
    async (input: SaveOnboardingStepRecord, context: RepositoryContext) => {
      void input;
      void context;
      return "session-1";
    },
  );
  readonly completeSpy = vi.fn(async () => "session-1");
  readonly validateSpy = vi.fn(async () => "session-1");

  async find() {
    return {
      id: "session-1",
      agencyId,
      clientId,
      status: "draft" as const,
      currentStep: 1,
      completedStepCount: 0,
      completedAt: null,
      validatedAt: null,
      validatedBy: null,
      updatedAt: "2026-07-23T10:00:00.000Z",
      answers: {},
      history: [],
    };
  }

  async saveStep(input: SaveOnboardingStepRecord, context: RepositoryContext) {
    return this.saveSpy(input, context);
  }

  async complete() {
    return this.completeSpy();
  }

  async validate() {
    return this.validateSpy();
  }
}

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const clientContext: ServiceContext = {
  tenant: {
    scope: "client",
    agencyId,
    clientId,
    actor: { kind: "user", actorId },
  },
  correlationId: "test-correlation",
  logger,
};

describe("OnboardingService", () => {
  it("requires both read and write permissions before saving", async () => {
    const repository = new OnboardingRepositoryFake();
    const service = new OnboardingService({
      onboarding: repository,
      access: new PermissionRepository(new Set(["onboarding.read"])),
    });

    await expect(
      service.saveStep(
        {
          sectionKey: "company_information",
          data: { companyName: "Acme" },
          isComplete: false,
          currentStep: 1,
        },
        clientContext,
      ),
    ).rejects.toMatchObject({ code: "permission_denied" });
    expect(repository.saveSpy).not.toHaveBeenCalled();
  });

  it("refuses an agency-scoped context for client onboarding", async () => {
    const repository = new OnboardingRepositoryFake();
    const service = new OnboardingService({
      onboarding: repository,
      access: new PermissionRepository(
        new Set(["onboarding.read", "onboarding.write"]),
      ),
    });

    await expect(
      service.find({
        ...clientContext,
        tenant: {
          scope: "agency",
          agencyId,
          actor: { kind: "user", actorId },
        },
      }),
    ).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("requires the dedicated validation permission", async () => {
    const repository = new OnboardingRepositoryFake();
    const service = new OnboardingService({
      onboarding: repository,
      access: new PermissionRepository(new Set(["onboarding.read"])),
    });

    await expect(service.validate(clientContext)).rejects.toMatchObject({
      code: "permission_denied",
    });
    expect(repository.validateSpy).not.toHaveBeenCalled();
  });
});
