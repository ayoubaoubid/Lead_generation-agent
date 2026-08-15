import type {
  DeterministicScoreResult,
  LeadScoringInput,
  ScoreComponent,
  ScoreField,
} from "@/domain/scoring/scoring";
import {
  scoreModelConfigurationSchema,
  type ScoreModelConfiguration,
  type ScoreRule,
} from "@/validations/scoring/scoring.schema";

function fieldValue(
  input: LeadScoringInput,
  field: ScoreField,
): string | number | readonly string[] | null {
  const values: Record<ScoreField, string | number | readonly string[] | null> =
    {
      industry: input.industry,
      country: input.country,
      employee_count: input.employeeCount,
      annual_revenue: input.annualRevenue,
      technologies: input.technologies,
      persona: input.personaIds,
      offer: input.offerIds,
      language: input.languages,
      problems: input.problems,
      intent_signals: input.intentSignals,
      maturity: input.maturity,
      data_quality: input.dataQuality,
      engagement_points: input.engagementPoints,
    };
  return values[field];
}

function isMissing(value: string | number | readonly string[] | null): boolean {
  return (
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function evaluateRule(
  rule: ScoreRule,
  value: string | number | readonly string[] | null,
): boolean {
  if (rule.operator === "exists") {
    return rule.expected === !isMissing(value);
  }
  if (isMissing(value)) return false;
  if (rule.operator === "equals") {
    return typeof value === "string" && typeof rule.expected === "string"
      ? normalized(value) === normalized(rule.expected)
      : value === rule.expected;
  }
  if (rule.operator === "includes") {
    const expected = rule.expected;
    if (!Array.isArray(value) || typeof expected !== "string") return false;
    return value.some((item) => normalized(item) === normalized(expected));
  }
  if (rule.operator === "in") {
    if (!Array.isArray(rule.expected) || typeof value !== "string")
      return false;
    return rule.expected.some((item) => normalized(item) === normalized(value));
  }
  if (
    (rule.operator === "gte" || rule.operator === "lte") &&
    typeof value === "number" &&
    typeof rule.expected === "number"
  ) {
    return rule.operator === "gte"
      ? value >= rule.expected
      : value <= rule.expected;
  }
  if (
    rule.operator === "between" &&
    typeof value === "number" &&
    typeof rule.expected === "object" &&
    !Array.isArray(rule.expected) &&
    "min" in rule.expected
  ) {
    return value >= rule.expected.min && value <= rule.expected.max;
  }
  return false;
}

function rounded(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class DeterministicScoreEngine {
  calculate(
    rawConfiguration: ScoreModelConfiguration,
    input: LeadScoringInput,
  ): DeterministicScoreResult {
    const configuration = scoreModelConfigurationSchema.parse(rawConfiguration);
    const componentTotals: Record<ScoreComponent, number> = {
      fit: 0,
      intent: 0,
      data_quality: 0,
      engagement: 0,
    };
    const componentMatches: Record<ScoreComponent, number> = {
      fit: 0,
      intent: 0,
      data_quality: 0,
      engagement: 0,
    };
    let availableWeight = 0;
    let totalRuleWeight = 0;
    const explanation = configuration.rules.map((rule) => {
      const value = fieldValue(input, rule.field);
      const missing = isMissing(value);
      const matched = evaluateRule(rule, value);
      componentTotals[rule.component] += rule.weight;
      totalRuleWeight += rule.weight;
      if (!missing) availableWeight += rule.weight;
      if (matched) componentMatches[rule.component] += rule.weight;
      return {
        ruleId: rule.id,
        component: rule.component,
        field: rule.field,
        weight: rule.weight,
        matched,
        missing,
      };
    });
    const componentScore = (component: ScoreComponent) =>
      rounded(
        componentTotals[component] === 0
          ? 0
          : (componentMatches[component] / componentTotals[component]) * 100,
      );
    const fitScore = componentScore("fit");
    const intentScore = componentScore("intent");
    const dataQualityScore = componentScore("data_quality");
    const engagementScore = componentScore("engagement");
    const weights = configuration.componentWeights;
    const totalComponentWeight =
      weights.fit + weights.intent + weights.data_quality + weights.engagement;
    const totalScore = rounded(
      (fitScore * weights.fit +
        intentScore * weights.intent +
        dataQualityScore * weights.data_quality +
        engagementScore * weights.engagement) /
        totalComponentWeight,
    );
    const confidenceScore = rounded(
      totalRuleWeight === 0 ? 0 : (availableWeight / totalRuleWeight) * 100,
    );
    const nextAction =
      confidenceScore < 60
        ? "collect_missing_data"
        : totalScore >= 75
          ? "prioritize"
          : totalScore >= 45
            ? "nurture"
            : "exclude";

    return {
      fitScore,
      intentScore,
      dataQualityScore,
      engagementScore,
      totalScore,
      confidenceScore,
      satisfiedCriteria: explanation
        .filter(({ matched }) => matched)
        .map(({ ruleId }) => ruleId),
      missingCriteria: explanation
        .filter(({ missing }) => missing)
        .map(({ ruleId }) => ruleId),
      appliedWeights: Object.fromEntries(
        configuration.rules.map(({ id, weight }) => [id, weight]),
      ),
      explanation,
      nextAction,
    };
  }
}
