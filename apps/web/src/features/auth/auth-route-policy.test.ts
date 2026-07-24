import { describe, expect, it } from "vitest";

import { isGuestOnlyPath, isProtectedPath } from "./auth-route-policy";

describe("authentication route policy", () => {
  it("protects workspace, account routes and sensitive Auth steps", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/campaigns")).toBe(true);
    expect(isProtectedPath("/settings/members")).toBe(true);
    expect(isProtectedPath("/account/profile")).toBe(true);
    expect(isProtectedPath("/auth/update-password")).toBe(true);
    expect(isProtectedPath("/auth/mfa")).toBe(true);
  });

  it("keeps sign-in and recovery request routes public", () => {
    expect(isProtectedPath("/auth/sign-in")).toBe(false);
    expect(isProtectedPath("/auth/forgot-password")).toBe(false);
  });

  it("redirects authenticated users away from guest-only routes", () => {
    expect(isGuestOnlyPath("/auth/sign-in")).toBe(true);
    expect(isGuestOnlyPath("/auth/register")).toBe(true);
    expect(isGuestOnlyPath("/auth/callback")).toBe(false);
  });
});
