import { describe, expect, it, vi } from "vitest";

import type { PermissionKey } from "@/domain/members/permission";
import type {
  ClientRepository,
  CreateClientRecord,
  ListClientsFilter,
  UpdateClientRecord,
} from "@/repositories/contracts/client.repository";
import type { RepositoryContext } from "@/repositories/repository-context";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type { Logger } from "@/lib/logging/logger";
import type { ServiceContext } from "@/services/service-context";

import { ClientService } from "./client.service";

const agencyId = "a0000000-0000-0000-0000-000000000001";
const clientId = "c0000000-0000-0000-0000-000000000001";
const actorId = "10000000-0000-0000-0000-000000000001";

const client = {
  id: clientId,
  agencyId,
  name: "Acme",
  slug: "acme",
  status: "active" as const,
  legalName: null,
  websiteUrl: "https://acme.test",
  industry: "SaaS",
  countryCode: "FR",
  languageCode: "fr",
  timezone: "Europe/Paris",
  description: null,
  logoUrl: null,
  objectives: ["Créer un pipeline qualifié"],
  createdAt: "2026-07-23T00:00:00.000Z",
  updatedAt: "2026-07-23T00:00:00.000Z",
  archivedAt: null,
  archivedBy: null,
};

class PermissionRepository implements TenantAccessRepository {
  constructor(private readonly granted: ReadonlySet<PermissionKey>) {}

  async hasActiveAgencyMembership(): Promise<boolean> {
    return true;
  }

  async canAccessClient(): Promise<boolean> {
    return true;
  }

  async hasPermission(
    _actorId: string,
    _agencyId: string,
    _clientId: string | null,
    permission: PermissionKey,
  ): Promise<boolean> {
    return this.granted.has(permission);
  }

  async listPermissions(): Promise<PermissionKey[]> {
    return [...this.granted];
  }
}

class ClientRepositoryFake implements ClientRepository {
  readonly createSpy = vi.fn(
    async (input: CreateClientRecord, context: RepositoryContext) => {
      void input;
      void context;
      return clientId;
    },
  );
  readonly updateSpy = vi.fn(
    async (input: UpdateClientRecord, context: RepositoryContext) => {
      void input;
      void context;
      return clientId;
    },
  );
  readonly archiveSpy = vi.fn(
    async (requestedClientId: string, context: RepositoryContext) => {
      void requestedClientId;
      void context;
      return clientId;
    },
  );

  async list(filter: ListClientsFilter, repositoryContext: RepositoryContext) {
    void filter;
    void repositoryContext;
    return {
      items: [client],
      page: 1,
      pageSize: 18,
      total: 1,
      totalPages: 1,
    };
  }

  async findById(requestedClientId: string) {
    return requestedClientId === clientId ? client : null;
  }

  async create(input: CreateClientRecord, context: RepositoryContext) {
    return this.createSpy(input, context);
  }

  async update(input: UpdateClientRecord, context: RepositoryContext) {
    return this.updateSpy(input, context);
  }

  async archive(requestedClientId: string, context: RepositoryContext) {
    return this.archiveSpy(requestedClientId, context);
  }

  async listMembers() {
    return [];
  }

  async listAssignableAgencyMembers() {
    return [];
  }

  async listClientRoles() {
    return [];
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
  correlationId: "test-correlation",
  logger,
};

function profileValues() {
  return {
    name: "Acme",
    slug: "acme",
    legalName: null,
    websiteUrl: "https://acme.test",
    industry: "SaaS",
    countryCode: "FR",
    languageCode: "fr",
    timezone: "Europe/Paris",
    description: null,
    logoUrl: null,
    objectives: ["Créer un pipeline qualifié"],
  } as const;
}

describe("ClientService", () => {
  it("refuses creation without the atomic client.create permission", async () => {
    const repository = new ClientRepositoryFake();
    const service = new ClientService({
      clients: repository,
      access: new PermissionRepository(new Set(["client.read"])),
    });

    await expect(
      service.create({ ...profileValues(), status: "onboarding" }, context),
    ).rejects.toMatchObject({ code: "permission_denied" });
    expect(repository.createSpy).not.toHaveBeenCalled();
  });

  it("archives only after both archive and read checks succeed", async () => {
    const repository = new ClientRepositoryFake();
    const service = new ClientService({
      clients: repository,
      access: new PermissionRepository(
        new Set(["client.read", "client.archive"]),
      ),
    });

    await expect(service.archive(clientId, context)).resolves.toBe(clientId);
    expect(repository.archiveSpy).toHaveBeenCalledOnce();
  });

  it("refuses a forged or inaccessible client identifier before mutation", async () => {
    const repository = new ClientRepositoryFake();
    const service = new ClientService({
      clients: repository,
      access: new PermissionRepository(
        new Set(["client.read", "client.manage"]),
      ),
    });

    await expect(
      service.update(
        {
          clientId: "c0000000-0000-0000-0000-000000000099",
          ...profileValues(),
          status: "active",
        },
        context,
      ),
    ).rejects.toMatchObject({ code: "resource_not_found" });
    expect(repository.updateSpy).not.toHaveBeenCalled();
  });
});
