import { describe, expect, it, vi } from "vitest";

import { AUTH_MESSAGES } from "./auth-messages";
import { requestPasswordRecovery } from "./password-recovery.service";

describe("password recovery privacy", () => {
  it("returns the same response whether the provider accepts or rejects the address", async () => {
    const acceptedClient = {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    };
    const rejectedClient = {
      resetPasswordForEmail: vi
        .fn()
        .mockResolvedValue({ error: new Error("user not found") }),
    };

    const [accepted, rejected] = await Promise.all([
      requestPasswordRecovery(
        acceptedClient,
        "known@example.test",
        "https://app.example.test/auth/callback",
      ),
      requestPasswordRecovery(
        rejectedClient,
        "unknown@example.test",
        "https://app.example.test/auth/callback",
      ),
    ]);

    expect(accepted).toEqual(rejected);
    expect(accepted.message).toBe(AUTH_MESSAGES.resetRequested);
  });

  it("also hides transport failures", async () => {
    const unavailableClient = {
      resetPasswordForEmail: vi.fn().mockRejectedValue(new Error("timeout")),
    };

    await expect(
      requestPasswordRecovery(
        unavailableClient,
        "person@example.test",
        "https://app.example.test/auth/callback",
      ),
    ).resolves.toMatchObject({ status: "success" });
  });
});
