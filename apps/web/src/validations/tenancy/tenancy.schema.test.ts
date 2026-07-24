import { describe, expect, it } from "vitest";

import {
  assignClientMemberSchema,
  createAgencySchema,
  selectAgencySchema,
  selectClientSchema,
} from "./tenancy.schema";

describe("tenancy schemas", () => {
  it("normalizes a valid agency payload", () => {
    expect(
      createAgencySchema.parse({
        name: "  Agence Exemple  ",
        slug: "agence-exemple",
      }),
    ).toEqual({
      name: "Agence Exemple",
      slug: "agence-exemple",
    });
  });

  it("rejects a malformed agency identifier", () => {
    expect(selectAgencySchema.safeParse({ agencyId: "agency-a" }).success).toBe(
      false,
    );
  });

  it("rejects a malformed active client identifier", () => {
    expect(selectClientSchema.safeParse({ clientId: "client-a" }).success).toBe(
      false,
    );
  });

  it("rejects an incomplete client assignment", () => {
    expect(
      assignClientMemberSchema.safeParse({
        clientId: "a1000000-0000-0000-0000-000000000001",
        profileId: "30000000-0000-0000-0000-000000000001",
      }).success,
    ).toBe(false);
  });
});
