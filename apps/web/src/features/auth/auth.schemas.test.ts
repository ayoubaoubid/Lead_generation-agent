import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  signInSchema,
  updatePasswordSchema,
  verifyMfaSchema,
} from "./auth.schemas";

describe("authentication validation", () => {
  it("normalizes a valid sign-in email without exposing authorization fields", () => {
    const result = signInSchema.parse({
      email: "  USER@Example.COM ",
      password: "not-validated-as-new",
      next: "/account/profile",
    });

    expect(result.email).toBe("user@example.com");
    expect(result).not.toHaveProperty("agencyId");
    expect(result).not.toHaveProperty("role");
  });

  it("rejects malformed recovery addresses", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("requires a strong matching password", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "short",
        passwordConfirmation: "short",
      }).success,
    ).toBe(false);
    expect(
      updatePasswordSchema.safeParse({
        password: "A-secure-value-2026",
        passwordConfirmation: "different-value-2026A",
      }).success,
    ).toBe(false);
    expect(
      updatePasswordSchema.safeParse({
        password: "A-secure-value-2026",
        passwordConfirmation: "A-secure-value-2026",
      }).success,
    ).toBe(true);
  });

  it("accepts only a UUID factor and a six-digit MFA code", () => {
    expect(
      verifyMfaSchema.safeParse({
        code: "123456",
        factorId: "10000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(true);
    expect(
      verifyMfaSchema.safeParse({ code: "12ab56", factorId: "factor" }).success,
    ).toBe(false);
  });
});
