import { describe, expect, it } from "vitest";

import type { OnboardingSession } from "./onboarding";
import { getOnboardingProgress } from "./onboarding";
import { buildOnboardingSkillContexts } from "./onboarding-skill-context";

function createSession(
  overrides: Partial<OnboardingSession> = {},
): OnboardingSession {
  return {
    id: "session-1",
    agencyId: "agency-1",
    clientId: "client-1",
    status: "completed",
    currentStep: 14,
    completedStepCount: 14,
    completedAt: "2026-07-23T10:00:00.000Z",
    validatedAt: null,
    validatedBy: null,
    updatedAt: "2026-07-23T10:00:00.000Z",
    answers: {
      problems_solved: {
        id: "answer-1",
        sectionKey: "problems_solved",
        data: { problems: ["Pipeline irrégulier"] },
        isComplete: true,
        revision: 1,
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
      competitors: {
        id: "answer-2",
        sectionKey: "competitors",
        data: { directCompetitors: ["Alternative A"] },
        isComplete: false,
        revision: 1,
        updatedAt: "2026-07-23T10:00:00.000Z",
      },
    },
    history: [],
    ...overrides,
  };
}

describe("onboarding domain", () => {
  it("clamps and calculates the progress percentage", () => {
    expect(getOnboardingProgress(-1)).toBe(0);
    expect(getOnboardingProgress(7)).toBe(50);
    expect(getOnboardingProgress(20)).toBe(100);
  });

  it("prepares only complete source sections for the five skills", () => {
    const contexts = buildOnboardingSkillContexts(createSession());

    expect(contexts).toHaveLength(5);
    expect(
      contexts.find((context) => context.skillKey === "mom_test")?.sections,
    ).toEqual({
      problems_solved: { problems: ["Pipeline irrégulier"] },
    });
    expect(
      contexts.find((context) => context.skillKey === "obviously_awesome")
        ?.sections,
    ).not.toHaveProperty("competitors");
  });

  it("does not prepare skill inputs from a draft", () => {
    expect(
      buildOnboardingSkillContexts(createSession({ status: "draft" })),
    ).toEqual([]);
  });
});
