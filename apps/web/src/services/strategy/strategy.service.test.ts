import { describe, expect, it, vi } from "vitest";

import type { Logger } from "@/lib/logging/logger";
import type { PermissionKey } from "@/domain/members/permission";
import type {
  CreateStrategyDraftRecord,
  CreateStrategyEvidenceRecord,
  SaveStrategyDraftRecord,
  StrategyRepository,
  ValidateStrategyVersionRecord,
} from "@/repositories/contracts/strategy.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type { ServiceContext } from "@/services/service-context";

import { StrategyService } from "./strategy.service";

const agencyId = "a0000000-0000-4000-8000-000000000001";
const clientId = "c0000000-0000-4000-8000-000000000001";
const actorId = "10000000-0000-4000-8000-000000000001";

class PermissionRepository implements TenantAccessRepository {
  constructor(private readonly permissions: ReadonlySet<PermissionKey>) {}
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
    return this.permissions.has(permission);
  }
  async listPermissions() {
    return [...this.permissions];
  }
}

class StrategyRepositoryFake implements StrategyRepository {
  readonly createDraftSpy = vi.fn(async () => "version-1");
  readonly createEvidenceSpy = vi.fn(async () => "evidence-1");
  readonly saveDraftSpy = vi.fn(async () => "version-1");
  readonly validateVersionSpy = vi.fn(async () => "version-1");

  async findWorkspace() {
    return { artifacts: [], evidence: [] };
  }
  async createEvidence(input: CreateStrategyEvidenceRecord) {
    void input;
    return this.createEvidenceSpy();
  }
  async createDraft(input: CreateStrategyDraftRecord) {
    void input;
    return this.createDraftSpy();
  }
  async saveDraft(input: SaveStrategyDraftRecord) {
    void input;
    return this.saveDraftSpy();
  }
  async validateVersion(input: ValidateStrategyVersionRecord) {
    void input;
    return this.validateVersionSpy();
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
  correlationId: "strategy-test",
  logger,
};

describe("StrategyService", () => {
  it("requires offer.write before creating a positioning or offer draft", async () => {
    const strategy = new StrategyRepositoryFake();
    const service = new StrategyService({
      strategy,
      access: new PermissionRepository(new Set(["offer.read"])),
    });

    await expect(
      service.createDraft(
        { artifactType: "positioning", name: "Positionnement" },
        context,
      ),
    ).rejects.toMatchObject({ code: "permission_denied" });
    expect(strategy.createDraftSpy).not.toHaveBeenCalled();
  });

  it("rejects agency-scoped access to client strategy", async () => {
    const service = new StrategyService({
      strategy: new StrategyRepositoryFake(),
      access: new PermissionRepository(new Set(["offer.read", "offer.write"])),
    });

    await expect(
      service.findWorkspace("offer", {
        ...context,
        tenant: {
          scope: "agency",
          agencyId,
          actor: { kind: "user", actorId },
        },
      }),
    ).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("delegates validation only after read and write checks", async () => {
    const strategy = new StrategyRepositoryFake();
    const service = new StrategyService({
      strategy,
      access: new PermissionRepository(new Set(["offer.read", "offer.write"])),
    });

    await expect(
      service.validateVersion(
        { artifactType: "offer", versionId: "version-1" },
        context,
      ),
    ).resolves.toBe("version-1");
    expect(strategy.validateVersionSpy).toHaveBeenCalledOnce();
  });
});
