import { describe, expect, it } from "vitest";

import {
  archiveClientSchema,
  createClientProfileSchema,
  updateClientProfileSchema,
} from "./client.schema";

const validProfile = {
  name: "Acme France",
  slug: "acme-france",
  legalName: "",
  websiteUrl: "https://acme.example",
  industry: "Logiciels",
  countryCode: "fr",
  languageCode: "fr-FR",
  timezone: "Europe/Paris",
  description: "",
  logoUrl: "https://cdn.example/acme.png",
  objectives:
    "Obtenir 10 rendez-vous\nQualifier le marché\nObtenir 10 rendez-vous",
};

describe("client schemas", () => {
  it("normalizes optional fields, country and objectives", () => {
    expect(
      createClientProfileSchema.parse({
        ...validProfile,
        status: "onboarding",
      }),
    ).toMatchObject({
      countryCode: "FR",
      legalName: null,
      objectives: ["Obtenir 10 rendez-vous", "Qualifier le marché"],
    });
  });

  it("rejects archive status through the general edit flow", () => {
    expect(
      updateClientProfileSchema.safeParse({
        clientId: "c1000000-0000-4000-8000-000000000001",
        ...validProfile,
        status: "archived",
      }).success,
    ).toBe(false);
  });

  it("requires explicit archival confirmation", () => {
    expect(
      archiveClientSchema.safeParse({
        clientId: "c1000000-0000-4000-8000-000000000001",
        confirmation: "Acme",
      }).success,
    ).toBe(false);
  });

  it("rejects insecure logo URLs", () => {
    expect(
      createClientProfileSchema.safeParse({
        ...validProfile,
        logoUrl: "http://cdn.example/acme.png",
        status: "draft",
      }).success,
    ).toBe(false);
  });
});
