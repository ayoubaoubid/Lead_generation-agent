import { describe, expect, it } from "vitest";

import type { PermissionKey } from "@/domain/members/permission";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type { TenantContext } from "@/types/tenant-context";

import {
  requireAllPermissions,
  requireAnyPermission,
  requirePermission,
  satisfiesPermissionRequirement,
} from "./permission.service";

class PermissionRepository implements TenantAccessRepository {
  constructor(private readonly permissions: ReadonlySet<PermissionKey>) {}

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
    return this.permissions.has(permission);
  }

  async listPermissions(): Promise<PermissionKey[]> {
    return [...this.permissions];
  }
}

const context: TenantContext = {
  scope: "client",
  agencyId: "a0000000-0000-0000-0000-000000000001",
  clientId: "a1000000-0000-0000-0000-000000000001",
  actor: {
    kind: "user",
    actorId: "10000000-0000-0000-0000-000000000001",
  },
};

describe("permission helpers", () => {
  it("requires every permission in an allOf requirement", () => {
    expect(
      satisfiesPermissionRequirement(["campaign.read", "campaign.approve"], {
        allOf: ["campaign.read", "campaign.approve"],
      }),
    ).toBe(true);

    expect(
      satisfiesPermissionRequirement(["campaign.approve"], {
        allOf: ["campaign.approve", "campaign.launch"],
      }),
    ).toBe(false);
  });

  it("accepts any one permission in an anyOf requirement", () => {
    expect(
      satisfiesPermissionRequirement(["message.approve"], {
        anyOf: ["campaign.approve", "message.approve"],
      }),
    ).toBe(true);
  });

  it("rejects campaign launch when only approval is granted", async () => {
    const repository = new PermissionRepository(new Set(["campaign.approve"]));

    await expect(
      requirePermission(context, "campaign.launch", repository),
    ).rejects.toMatchObject({ code: "permission_denied" });
  });

  it("supports explicit all and any server checks", async () => {
    const repository = new PermissionRepository(
      new Set(["campaign.read", "message.approve"]),
    );

    await expect(
      requireAllPermissions(
        context,
        ["campaign.read", "message.approve"],
        repository,
      ),
    ).resolves.toBeUndefined();

    await expect(
      requireAnyPermission(
        context,
        ["campaign.launch", "message.approve"],
        repository,
      ),
    ).resolves.toBeUndefined();
  });
});
