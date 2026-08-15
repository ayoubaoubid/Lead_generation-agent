import type { SegmentFilter } from "@/validations/scoring/scoring.schema";
import { segmentFilterSchema } from "@/validations/scoring/scoring.schema";

export type SegmentCandidate = Readonly<{
  industry: string | null;
  country: string | null;
  employeeCount: number | null;
  personaIds: readonly string[];
  offerIds: readonly string[];
  totalScore: number | null;
  languages: readonly string[];
  problems: readonly string[];
  intentSignals: readonly string[];
  maturity: string | null;
}>;

export type SegmentEvaluation = Readonly<{
  matches: boolean;
  matchedCriteria: readonly string[];
  failedCriteria: readonly string[];
}>;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

function overlaps(
  candidate: readonly string[],
  expected: readonly string[],
): boolean {
  if (expected.length === 0) return true;
  const values = new Set(candidate.map(normalized));
  return expected.some((value) => values.has(normalized(value)));
}

export class DynamicSegmentEngine {
  evaluate(
    rawFilter: SegmentFilter,
    candidate: SegmentCandidate,
  ): SegmentEvaluation {
    const filter = segmentFilterSchema.parse(rawFilter);
    const checks: readonly [string, boolean][] = [
      [
        "industry",
        filter.industries.length === 0 ||
          (candidate.industry !== null &&
            overlaps([candidate.industry], filter.industries)),
      ],
      [
        "country",
        filter.countries.length === 0 ||
          (candidate.country !== null &&
            filter.countries.includes(candidate.country)),
      ],
      [
        "employee_count",
        filter.employeeCount === null ||
          (candidate.employeeCount !== null &&
            (filter.employeeCount.min === null ||
              candidate.employeeCount >= filter.employeeCount.min) &&
            (filter.employeeCount.max === null ||
              candidate.employeeCount <= filter.employeeCount.max)),
      ],
      ["persona", overlaps(candidate.personaIds, filter.personaIds)],
      ["offer", overlaps(candidate.offerIds, filter.offerIds)],
      [
        "minimum_score",
        filter.minimumScore === null ||
          (candidate.totalScore !== null &&
            candidate.totalScore >= filter.minimumScore),
      ],
      [
        "maximum_score",
        filter.maximumScore === null ||
          (candidate.totalScore !== null &&
            candidate.totalScore <= filter.maximumScore),
      ],
      ["language", overlaps(candidate.languages, filter.languages)],
      ["problem", overlaps(candidate.problems, filter.problems)],
      ["intent", overlaps(candidate.intentSignals, filter.intentSignals)],
      [
        "maturity",
        filter.maturityLevels.length === 0 ||
          (candidate.maturity !== null &&
            overlaps([candidate.maturity], filter.maturityLevels)),
      ],
    ];
    return {
      matches: checks.every(([, matches]) => matches),
      matchedCriteria: checks
        .filter(([, matches]) => matches)
        .map(([criterion]) => criterion),
      failedCriteria: checks
        .filter(([, matches]) => !matches)
        .map(([criterion]) => criterion),
    };
  }
}
