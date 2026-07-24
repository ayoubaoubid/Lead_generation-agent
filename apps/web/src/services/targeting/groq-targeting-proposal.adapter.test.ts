import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { GroqTargetingProposalAdapter } from "./groq-targeting-proposal.adapter";

const validIcp = {
  rationale: ["Segment à tester"],
  industries: ["Industrie"],
  countries: ["France"],
  companySizes: ["PME"],
  employeeCount: { min: 20, max: 200 },
  annualRevenue: { min: null, max: null, currencyCode: "" },
  technologies: [],
  maturityLevels: ["Processus commercial établi"],
  budget: { min: null, max: null, currencyCode: "" },
  problems: ["Qualification lente"],
  intentSignals: ["Recrutement SDR"],
  exclusions: [],
  scoringWeights: [
    { criterion: "industry", weight: 50 },
    { criterion: "problem", weight: 50 },
  ],
  assumptions: ["Budget disponible à vérifier"],
  missingEvidence: ["Entretiens passés sur le budget"],
};

describe("GroqTargetingProposalAdapter", () => {
  it("validates the strict response and records token cost metadata", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  profiles: [{ name: "PME industrielles", content: validIcp }],
                }),
              },
            },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 200 },
        }),
    );
    const adapter = new GroqTargetingProposalAdapter("test-key", fetcher);

    const result = await adapter.propose({
      profileType: "icp",
      objective: "Tester les PME industrielles qui recrutent des SDR.",
      existingProfileNames: [],
    });

    expect(result.profiles).toHaveLength(1);
    expect(result.costMicrousd).toBe(68);
    expect(result.promptVersion).toBe("targeting-mom-test-v1");
    const request = fetcher.mock.calls[0]?.[1];
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer test-key",
    });
  });

  it("rejects provider content that does not match the requested type", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  profiles: [{ name: "Invalide", content: { invented: true } }],
                }),
              },
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
    );
    const adapter = new GroqTargetingProposalAdapter("test-key", fetcher);
    await expect(
      adapter.propose({
        profileType: "icp",
        objective: "Un objectif suffisamment détaillé pour être testé.",
        existingProfileNames: [],
      }),
    ).rejects.toBeDefined();
  });
});
