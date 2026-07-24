import { describe, expect, it } from "vitest";

import {
  isPermissionKey,
  type PermissionKey,
} from "@/domain/members/permission";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";

import {
  requireTenantPermission,
  resolveUserTenantContext,
} from "./resolve-tenant-context.service";

class FakeTenantAccessRepository implements TenantAccessRepository {
  constructor(
    private readonly agencies: ReadonlySet<string>,
    private readonly clients: ReadonlySet<string>,
    private readonly permissions: ReadonlySet<string> = new Set(),
  ) {}

  async hasActiveAgencyMembership(
    _actorId: string,
    agencyId: string,
  ): Promise<boolean> {
    return this.agencies.has(agencyId);
  }

  async canAccessClient(
    _actorId: string,
    agencyId: string,
    clientId: string,
  ): Promise<boolean> {
    return this.clients.has(`${agencyId}:${clientId}`);
  }

  async hasPermission(
    _actorId: string,
    agencyId: string,
    clientId: string | null,
    permission: PermissionKey,
  ): Promise<boolean> {
    return this.permissions.has(
      `${agencyId}:${clientId ?? "agency"}:${permission}`,
    );
  }

  async listPermissions(
    _actorId: string,
    agencyId: string,
    clientId: string | null,
  ): Promise<PermissionKey[]> {
    const prefix = `${agencyId}:${clientId ?? "agency"}:`;

    return [...this.permissions]
      .filter((permission) => permission.startsWith(prefix))
      .map((permission) => permission.slice(prefix.length))
      .filter(isPermissionKey);
  }
}

const actorId = "10000000-0000-0000-0000-000000000001";
const agencyA = "a0000000-0000-0000-0000-000000000001";
const agencyB = "b0000000-0000-0000-0000-000000000001";
const clientA = "a1000000-0000-0000-0000-000000000001";

describe("resolveUserTenantContext", () => {
  it("resolves an agency only from a verified active membership", async () => {
    const repository = new FakeTenantAccessRepository(
      new Set([agencyA]),
      new Set(),
    );

    await expect(
      resolveUserTenantContext({ agencyId: agencyA }, actorId, repository),
    ).resolves.toEqual({
      scope: "agency",
      agencyId: agencyA,
      actor: { kind: "user", actorId },
    });
  });

  it("rejects a forged agency identifier", async () => {
    const repository = new FakeTenantAccessRepository(
      new Set([agencyA]),
      new Set(),
    );

    await expect(
      resolveUserTenantContext({ agencyId: agencyB }, actorId, repository),
    ).rejects.toMatchObject({
      code: "tenant_mismatch",
    });
  });

  it("rejects a client outside the verified agency assignment", async () => {
    const repository = new FakeTenantAccessRepository(
      new Set([agencyA]),
      new Set(),
    );

    await expect(
      resolveUserTenantContext(
        { agencyId: agencyA, clientId: clientA },
        actorId,
        repository,
      ),
    ).rejects.toMatchObject({
      code: "tenant_mismatch",
    });
  });

  it("requires an explicit permission after resolving the tenant", async () => {
    const repository = new FakeTenantAccessRepository(
      new Set([agencyA]),
      new Set(),
    );
    const context = await resolveUserTenantContext(
      { agencyId: agencyA },
      actorId,
      repository,
    );

    await expect(
      requireTenantPermission(context, "client.create", repository),
    ).rejects.toMatchObject({
      code: "permission_denied",
    });
  });
});
