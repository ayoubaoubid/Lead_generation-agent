import { describe, expect, it } from "vitest";

import {
  createEvidenceSchema,
  offerContentSchema,
  positioningContentSchema,
} from "./strategy-artifact.schema";

describe("strategy artifact validation", () => {
  it("requires a source for confirmed evidence", () => {
    expect(
      createEvidenceSchema.safeParse({
        evidenceType: "statistic",
        title: "Conversion",
        description: "Mesure annoncée",
        classification: "confirmed",
        sourceUrl: "",
        sourceReference: "",
      }).success,
    ).toBe(false);
  });

  it("accepts inferred evidence without presenting it as confirmed", () => {
    expect(
      createEvidenceSchema.safeParse({
        evidenceType: "internal_data",
        title: "Signal commercial",
        description: "Observation à confirmer",
        classification: "inferred",
        sourceUrl: "",
        sourceReference: "",
      }).success,
    ).toBe(true);
  });

  it("rejects non-HTTP source protocols", () => {
    expect(
      createEvidenceSchema.safeParse({
        evidenceType: "document",
        title: "Source dangereuse",
        description: "Protocole non autorisé",
        classification: "confirmed",
        sourceUrl: "javascript:alert(1)",
        sourceReference: "",
      }).success,
    ).toBe(false);
  });

  it("rejects offer-only content from a positioning version", () => {
    expect(
      positioningContentSchema.safeParse([
        {
          kind: "guarantee",
          value: "Garantie conditionnelle",
          classification: "hypothesis",
          evidenceIds: [],
        },
      ]).success,
    ).toBe(false);
  });

  it("preserves the classification and evidence identifiers of every item", () => {
    const result = offerContentSchema.parse([
      {
        kind: "promise",
        value: "Réduire le délai de qualification",
        classification: "inferred",
        evidenceIds: ["a0000000-0000-4000-8000-000000000001"],
      },
      {
        kind: "guarantee",
        value: "Garantie encore non autorisée",
        classification: "missing",
        evidenceIds: [],
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ classification: "inferred" }),
      expect.objectContaining({ classification: "missing" }),
    ]);
  });
});
