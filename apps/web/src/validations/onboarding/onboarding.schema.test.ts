import { describe, expect, it } from "vitest";

import { parseOnboardingSectionInput } from "./onboarding.schema";

describe("onboarding section validation", () => {
  it("keeps a partial answer as a draft", () => {
    expect(
      parseOnboardingSectionInput(
        "company_information",
        {
          companyName: "Acme",
          websiteUrl: "",
          industry: "",
          countryCode: "ma",
          employeeRange: "",
          description: "",
        },
        false,
      ),
    ).toMatchObject({ companyName: "Acme", countryCode: "MA" });
  });

  it("rejects an incomplete answer marked complete", () => {
    expect(() =>
      parseOnboardingSectionInput(
        "company_information",
        {
          companyName: "Acme",
          websiteUrl: "",
          industry: "",
          countryCode: "MA",
          employeeRange: "",
          description: "",
        },
        true,
      ),
    ).toThrow();
  });

  it("normalizes unique line-separated lists", () => {
    expect(
      parseOnboardingSectionInput(
        "products_services",
        {
          primaryProductsServices: "Audit\nAutomatisation\nAudit",
          deliveryModel: "",
          differentiators: "",
        },
        true,
      ),
    ).toMatchObject({
      primaryProductsServices: ["Audit", "Automatisation"],
    });
  });

  it("rejects an inverted price range", () => {
    expect(() =>
      parseOnboardingSectionInput(
        "pricing",
        {
          pricingModel: "Forfait",
          currencyCode: "EUR",
          minimumPrice: "5000",
          maximumPrice: "1000",
          pricingNotes: "",
        },
        false,
      ),
    ).toThrow();
  });

  it("rejects an oversized field instead of silently discarding it", () => {
    expect(() =>
      parseOnboardingSectionInput(
        "company_information",
        {
          companyName: "A".repeat(161),
          websiteUrl: "",
          industry: "Conseil",
          countryCode: "MA",
          employeeRange: "",
          description: "Description vérifiable.",
        },
        false,
      ),
    ).toThrow();
  });
});
