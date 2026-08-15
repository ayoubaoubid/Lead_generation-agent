import { describe, expect, it } from "vitest";

import { createContactSchema } from "@/validations/contacts/contact.schema";

const base = {
  companyId: "",
  firstName: "Ada",
  lastName: "Lovelace",
  fullName: "",
  email: "ada@example.com",
  linkedinUrl: "",
  jobTitle: "",
  department: "",
  seniority: "",
  phone: "",
  countryCode: "",
  factStatus: "confirmed",
  confidenceScore: "",
  sourceProvider: "",
  externalId: "",
  sourceUrl: "",
  collectedAt: null,
};

describe("createContactSchema", () => {
  it("accepts a composed name with an email", () => {
    expect(createContactSchema.safeParse(base).success).toBe(true);
  });

  it("rejects contacts without an email or LinkedIn profile", () => {
    expect(createContactSchema.safeParse({ ...base, email: "" }).success).toBe(
      false,
    );
  });
});
