import { describe, expect, it } from "vitest";

import {
  icpContentSchema,
  personaContentSchema,
  validatableIcpContentSchema,
  validatablePersonaContentSchema,
} from "./targeting-profile.schema";

const emptyIcp = {
  rationale: [],
  industries: [],
  countries: [],
  companySizes: [],
  employeeCount: { min: null, max: null },
  annualRevenue: { min: null, max: null, currencyCode: "" },
  technologies: [],
  maturityLevels: [],
  budget: { min: null, max: null, currencyCode: "" },
  problems: [],
  intentSignals: [],
  exclusions: [],
  scoringWeights: [],
  assumptions: [],
  missingEvidence: [],
};

const emptyPersona = {
  rationale: [],
  jobTitles: [],
  departments: [],
  seniorityLevels: [],
  responsibilities: [],
  goals: [],
  problems: [],
  objections: [],
  decisionPower: "unknown",
  buyingRoles: [],
  preferredChannels: [],
  assumptions: [],
  missingEvidence: [],
};

describe("targeting profile validation", () => {
  it("accepts incomplete structured drafts but not human validation", () => {
    expect(icpContentSchema.safeParse(emptyIcp).success).toBe(true);
    expect(validatableIcpContentSchema.safeParse(emptyIcp).success).toBe(false);
    expect(personaContentSchema.safeParse(emptyPersona).success).toBe(true);
    expect(
      validatablePersonaContentSchema.safeParse(emptyPersona).success,
    ).toBe(false);
  });

  it("requires unique ICP scoring criteria totaling 100 for validation", () => {
    const duplicate = {
      ...emptyIcp,
      industries: ["Industrie"],
      problems: ["Cycle de qualification long"],
      scoringWeights: [
        { criterion: "industry", weight: 50 },
        { criterion: "industry", weight: 50 },
      ],
    };
    expect(icpContentSchema.safeParse(duplicate).success).toBe(false);

    expect(
      validatableIcpContentSchema.safeParse({
        ...duplicate,
        scoringWeights: [
          { criterion: "industry", weight: 60 },
          { criterion: "problem", weight: 40 },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects contradictory ranges and money without an ISO currency", () => {
    expect(
      icpContentSchema.safeParse({
        ...emptyIcp,
        employeeCount: { min: 200, max: 20 },
      }).success,
    ).toBe(false);
    expect(
      icpContentSchema.safeParse({
        ...emptyIcp,
        budget: { min: 5000, max: null, currencyCode: "" },
      }).success,
    ).toBe(false);
  });

  it("validates a persona only with a role, a problem or goal, and a buying role", () => {
    expect(
      validatablePersonaContentSchema.safeParse({
        ...emptyPersona,
        jobTitles: ["Directrice commerciale"],
        problems: ["Pipeline imprévisible"],
        buyingRoles: ["Décideur"],
      }).success,
    ).toBe(true);
  });
});
