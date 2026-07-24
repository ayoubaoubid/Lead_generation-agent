import { describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/domain/members/permission";
import type {
  CreateAiTargetingProposalRecord,
  CreateTargetingDraftRecord,
  CreateTargetingVersionRecord,
  SaveTargetingDraftRecord,
  SetTargetingLifecycleRecord,
  TargetingRepository,
  ValidateTargetingVersionRecord,
} from "@/repositories/contracts/targeting.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type { Logger } from "@/lib/logging/logger";
import type { ServiceContext } from "@/services/service-context";

import { TargetingService } from "./targeting.service";

const agencyId = "a0000000-0000-4000-8000-000000000001";
const clientId = "c0000000-0000-4000-8000-000000000001";
const actorId = "10000000-0000-4000-8000-000000000001";

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

class TargetingRepositoryFake implements TargetingRepository {
  readonly createDraftSpy = vi.fn(async () => "version-1");
  readonly validateSpy = vi.fn(async () => "version-1");
  readonly aiSpy = vi.fn(async () => "version-ai");

  async findWorkspace() {
    return { profiles: [] };
  }
  async createDraft(input: CreateTargetingDraftRecord) {
    void input;
    return this.createDraftSpy();
  }
  async createVersion(input: CreateTargetingVersionRecord) {
    void input;
    return "version-2";
  }
  async saveDraft(input: SaveTargetingDraftRecord) {
    void input;
    return "version-1";
  }
  async validateVersion(input: ValidateTargetingVersionRecord) {
    void input;
    return this.validateSpy();
  }
  async setLifecycle(input: SetTargetingLifecycleRecord) {
    return input.profileId;
  }
  async createAiProposal(input: CreateAiTargetingProposalRecord) {
    void input;
    return this.aiSpy();
  }
}

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
  correlationId: "targeting-test",
  logger,
};

describe("TargetingService", () => {
  it("refuses profile creation without targeting.write", async () => {
    const targeting = new TargetingRepositoryFake();
    const service = new TargetingService({
      targeting,
      access: new PermissionRepository(new Set(["targeting.read"])),
    });
    await expect(
      service.createDraft({ profileType: "icp", name: "ICP" }, context),
    ).rejects.toMatchObject({ code: "permission_denied" });
    expect(targeting.createDraftSpy).not.toHaveBeenCalled();
  });

  it("separates human validation from write permission", async () => {
    const targeting = new TargetingRepositoryFake();
    const service = new TargetingService({
      targeting,
      access: new PermissionRepository(
        new Set(["targeting.read", "targeting.write"]),
      ),
    });
    await expect(
      service.validateVersion(
        { profileType: "persona", versionId: "version-1" },
        context,
      ),
    ).rejects.toMatchObject({ code: "permission_denied" });
    expect(targeting.validateSpy).not.toHaveBeenCalled();
  });

  it("requires targeting.propose independently from human validation", async () => {
    const targeting = new TargetingRepositoryFake();
    const service = new TargetingService({
      targeting,
      access: new PermissionRepository(
        new Set(["targeting.read", "targeting.validate"]),
      ),
    });
    await expect(
      service.createAiProposal(
        {
          profileType: "icp",
          name: "Proposition",
          content: {
            rationale: [],
            industries: [],
            countries: [],
            companySizes: [],
            employeeCount: { min: null, max: null },
            annualRevenue: { min: null, max: null, currencyCode: "" },
            technologies: [],
            maturityLevels: [],
            budget: { min: null, max: null, currencyCode: "" },
            problems: [],
            intentSignals: [],
            exclusions: [],
            scoringWeights: [],
            assumptions: [],
            missingEvidence: [],
          },
          executionId: crypto.randomUUID(),
          modelId: "openai/gpt-oss-20b",
          skillVersion: "1.0.0",
          promptVersion: "v1",
          inputTokens: 10,
          outputTokens: 20,
          costMicrousd: 7,
          pricingVersion: "test",
        },
        context,
      ),
    ).rejects.toMatchObject({ code: "permission_denied" });
    expect(targeting.aiSpy).not.toHaveBeenCalled();
  });
});
