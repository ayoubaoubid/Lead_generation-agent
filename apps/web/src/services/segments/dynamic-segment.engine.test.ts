import { describe, expect, it } from "vitest";

import { DynamicSegmentEngine } from "@/services/segments/dynamic-segment.engine";
import type { SegmentFilter } from "@/validations/scoring/scoring.schema";

const personaId = "10000000-0000-4000-8000-000000000001";
const offerId = "20000000-0000-4000-8000-000000000001";

const filter: SegmentFilter = {
  industries: ["SaaS"],
  countries: ["FR"],
  employeeCount: { min: 20, max: 200 },
  personaIds: [personaId],
  offerIds: [offerId],
  minimumScore: 70,
  maximumScore: 100,
  languages: ["fr"],
  problems: ["slow pipeline"],
  intentSignals: ["hiring sales"],
  maturityLevels: ["growth"],
};

const candidate = {
  industry: "saas",
  country: "FR",
  employeeCount: 75,
  personaIds: [personaId],
  offerIds: [offerId],
  totalScore: 82,
  languages: ["FR"],
  problems: ["Slow Pipeline"],
  intentSignals: ["Hiring Sales"],
  maturity: "growth",
} as const;

describe("DynamicSegmentEngine", () => {
  it("matches all configured segmentation dimensions deterministically", () => {
    const result = new DynamicSegmentEngine().evaluate(filter, candidate);

    expect(result.matches).toBe(true);
    expect(result.failedCriteria).toEqual([]);
    expect(result.matchedCriteria).toContain("intent");
  });

  it("explains every failed filter", () => {
    const result = new DynamicSegmentEngine().evaluate(filter, {
      ...candidate,
      country: "MA",
      totalScore: 50,
    });

    expect(result.matches).toBe(false);
    expect(result.failedCriteria).toEqual(["country", "minimum_score"]);
  });
});
