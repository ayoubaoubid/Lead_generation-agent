import { z } from "zod";

import {
  offerItemKinds,
  positioningItemKinds,
  strategyClaimStatuses,
  strategyEvidenceTypes,
  strategyItemKinds,
  type StrategyArtifactType,
  type StrategyContentItem,
} from "@/domain/strategy/strategy-artifact";

const uuidSchema = z.uuid();
const contentLineSchema = z.string().trim().min(1).max(4000);

export const strategyContentItemSchema = z.object({
  kind: z.enum(strategyItemKinds),
  value: contentLineSchema,
  classification: z.enum(strategyClaimStatuses),
  evidenceIds: z.array(uuidSchema).max(20),
});

export const positioningContentSchema = z
  .array(strategyContentItemSchema)
  .max(100)
  .refine(
    (items) =>
      items.every((item) =>
        positioningItemKinds.includes(
          item.kind as (typeof positioningItemKinds)[number],
        ),
      ),
    { message: "Le contenu contient un élément étranger au positionnement." },
  );

export const offerContentSchema = z
  .array(strategyContentItemSchema)
  .max(100)
  .refine(
    (items) =>
      items.every((item) =>
        offerItemKinds.includes(item.kind as (typeof offerItemKinds)[number]),
      ),
    { message: "Le contenu contient un élément étranger à l’offre." },
  );

export const createEvidenceSchema = z
  .object({
    evidenceType: z.enum(strategyEvidenceTypes),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(4000),
    classification: z.enum(["confirmed", "inferred", "hypothesis"]),
    sourceUrl: z.union([
      z.literal(""),
      z
        .url()
        .max(2048)
        .refine((value) => /^https?:\/\//iu.test(value), {
          message: "La source doit utiliser HTTP ou HTTPS.",
        }),
    ]),
    sourceReference: z.string().trim().max(500),
  })
  .refine(
    (value) =>
      value.classification !== "confirmed" ||
      value.sourceUrl.length > 0 ||
      value.sourceReference.length > 0,
    {
      message: "Une preuve confirmée exige une source.",
      path: ["sourceReference"],
    },
  );

export const createOfferSchema = z.object({
  name: z.string().trim().min(1).max(160),
});

export const strategyVersionActionSchema = z.object({
  artifactId: uuidSchema.optional(),
  versionId: uuidSchema.optional(),
  name: z.string().trim().min(1).max(160).default("Positionnement"),
});

export type StrategyFieldDefinition = Readonly<{
  kind: StrategyContentItem["kind"];
  label: string;
  description: string;
  requiredForValidation: boolean;
}>;

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseStrategyContentForm(
  formData: FormData,
  artifactType: StrategyArtifactType,
  fields: readonly StrategyFieldDefinition[],
): readonly StrategyContentItem[] {
  const items = fields.flatMap((field) => {
    const classification = z
      .enum(strategyClaimStatuses)
      .parse(formString(formData, `${field.kind}.classification`));
    const evidenceId = formString(formData, `${field.kind}.evidenceId`);
    const evidenceIds = evidenceId ? [uuidSchema.parse(evidenceId)] : [];
    const values = [
      ...new Set(
        formString(formData, `${field.kind}.value`)
          .split(/\r?\n/u)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    return values.map((value) => ({
      kind: field.kind,
      value,
      classification,
      evidenceIds,
    }));
  });

  return (
    artifactType === "positioning"
      ? positioningContentSchema
      : offerContentSchema
  ).parse(items);
}
