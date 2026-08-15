import { describe, expect, it } from "vitest";

import { createCompanySchema } from "@/validations/companies/company.schema";

const base = {
  name: "Acme",
  domain: "acme.example",
  websiteUrl: "",
  industry: "",
  countryCode: "",
  employeeCount: "",
  annualRevenue: "",
  revenueCurrency: "",
  technologies: "",
  description: "",
  factStatus: "confirmed",
  confidenceScore: "",
  sourceProvider: "",
  externalId: "",
  sourceUrl: "",
  collectedAt: null,
};

describe("createCompanySchema", () => {
  it("normalizes optional numeric and list fields", () => {
    const result = createCompanySchema.parse({
      ...base,
      technologies: "Next.js, Supabase",
      confidenceScore: "90",
    });

    expect(result.technologies).toEqual(["Next.js", "Supabase"]);
    expect(result.confidenceScore).toBe(90);
    expect(result.employeeCount).toBeNull();
  });

  it("requires a provider for an external identifier", () => {
    expect(
      createCompanySchema.safeParse({ ...base, externalId: "external-1" })
        .success,
    ).toBe(false);
  });
});
