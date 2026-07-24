import { describe, expect, it } from "vitest";

import {
  getCallbackRedirectPath,
  getPostAuthRedirectPath,
  getSafeRedirectPath,
} from "./auth-redirect";

describe("authentication redirects", () => {
  it("keeps a local path and its query string", () => {
    expect(getSafeRedirectPath("/account/profile?tab=security")).toBe(
      "/account/profile?tab=security",
    );
  });

  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "javascript:alert(1)",
  ])("rejects unsafe redirect %s", (candidate) => {
    expect(getSafeRedirectPath(candidate)).toBe("/dashboard");
  });

  it("prevents a post-login redirect loop into guest routes", () => {
    expect(getPostAuthRedirectPath("/auth/sign-in")).toBe("/dashboard");
  });

  it("forces invitation and recovery links to password setup", () => {
    expect(getCallbackRedirectPath("/account/profile", "invite")).toBe(
      "/auth/update-password",
    );
    expect(getCallbackRedirectPath("/account/profile", "recovery")).toBe(
      "/auth/update-password",
    );
  });

  it("allows only known callback destinations", () => {
    expect(getCallbackRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getCallbackRedirectPath("/design-system")).toBe("/dashboard");
    expect(getCallbackRedirectPath("/auth/mfa")).toBe("/auth/mfa");
  });
});
