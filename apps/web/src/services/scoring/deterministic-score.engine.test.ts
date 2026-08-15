import { describe, expect, it } from "vitest";

import type { LeadScoringInput } from "@/domain/scoring/scoring";
import { DeterministicScoreEngine } from "@/services/scoring/deterministic-score.engine";
import type { ScoreModelConfiguration } from "@/validations/scoring/scoring.schema";

const configuration: ScoreModelConfiguration = {
  version: "1.0.0",
  componentWeights: {
    fit: 40,
    intent: 30,
    data_quality: 20,
    engagement: 10,
  },
  rules: [
    {
      id: "fit-industry",
      label: "Industry is SaaS",
      component: "fit",
      field: "industry",
      operator: "equals",
      expected: "SaaS",
      weight: 60,
    },
    {
      id: "fit-employees",
      label: "At least 50 employees",
      component: "fit",
      field: "employee_count",
      operator: "gte",
      expected: 50,
      weight: 40,
    },
    {
      id: "intent-hiring",
      label: "Hiring signal",
      component: "intent",
      field: "intent_signals",
      operator: "includes",
      expected: "hiring sales",
      weight: 100,
    },
    {
      id: "quality-complete",
      label: "Data quality is at least 80",
      component: "data_quality",
      field: "data_quality",
      operator: "gte",
      expected: 80,
      weight: 100,
    },
    {
      id: "engagement-recent",
      label: "At least five engagement points",
      component: "engagement",
      field: "engagement_points",
      operator: "gte",
      expected: 5,
      weight: 100,
    },
  ],
};

const input: LeadScoringInput = {
  industry: "saas",
  country: "FR",
  employeeCount: 75,
  annualRevenue: null,
  technologies: [],
  personaIds: [],
  offerIds: [],
  languages: ["fr"],
  problems: [],
  intentSignals: ["Hiring Sales"],
  maturity: null,
  dataQuality: 85,
  engagementPoints: 8,
};

describe("DeterministicScoreEngine", () => {
  it("calculates all five scores from versioned explicit rules", () => {
    const result = new DeterministicScoreEngine().calculate(
      configuration,
      input,
    );

    expect(result).toMatchObject({
      fitScore: 100,
      intentScore: 100,
      dataQualityScore: 100,
      engagementScore: 100,
      totalScore: 100,
      confidenceScore: 100,
      nextAction: "prioritize",
    });
    expect(result.satisfiedCriteria).toEqual([
      "fit-industry",
      "fit-employees",
      "intent-hiring",
      "quality-complete",
      "engagement-recent",
    ]);
    expect(result.appliedWeights["fit-industry"]).toBe(60);
  });

  it("is reproducible for the same configuration and input", () => {
    const engine = new DeterministicScoreEngine();

    expect(engine.calculate(configuration, input)).toEqual(
      engine.calculate(configuration, input),
    );
  });

  it("explains missing criteria instead of letting an AI guess", () => {
    const result = new DeterministicScoreEngine().calculate(configuration, {
      ...input,
      intentSignals: [],
      engagementPoints: null,
    });

    expect(result.missingCriteria).toEqual([
      "intent-hiring",
      "engagement-recent",
    ]);
    expect(result.confidenceScore).toBe(50);
    expect(result.nextAction).toBe("collect_missing_data");
  });
});
