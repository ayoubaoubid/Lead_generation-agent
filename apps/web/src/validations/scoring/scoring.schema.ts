import { z } from "zod";

import {
  scoreComponents,
  scoreFields,
  scoreOperators,
} from "@/domain/scoring/scoring";

const expectedValueSchema = z.union([
  z.string().trim().min(1).max(500),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().min(1).max(500)).max(100),
  z
    .object({
      min: z.number().finite(),
      max: z.number().finite(),
    })
    .strict()
    .refine(({ min, max }) => min <= max),
]);

export const scoreRuleSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(200),
    component: z.enum(scoreComponents),
    field: z.enum(scoreFields),
    operator: z.enum(scoreOperators),
    expected: expectedValueSchema,
    weight: z.number().positive().max(1000),
  })
  .strict();

export const scoreModelConfigurationSchema = z
  .object({
    version: z.string().trim().min(1).max(100),
    componentWeights: z
      .object({
        fit: z.number().nonnegative().max(100),
        intent: z.number().nonnegative().max(100),
        data_quality: z.number().nonnegative().max(100),
        engagement: z.number().nonnegative().max(100),
      })
      .strict()
      .refine(
        (weights) =>
          weights.fit +
            weights.intent +
            weights.data_quality +
            weights.engagement >
          0,
        { message: "At least one score component must be weighted." },
      ),
    rules: z.array(scoreRuleSchema).min(1).max(500),
  })
  .strict()
  .superRefine(({ rules }, context) => {
    const ids = new Set<string>();
    for (const [index, rule] of rules.entries()) {
      if (ids.has(rule.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate score rule ${rule.id}.`,
          path: ["rules", index, "id"],
        });
      }
      ids.add(rule.id);
    }
  });

export const segmentFilterSchema = z
  .object({
    industries: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
    countries: z
      .array(
        z
          .string()
          .trim()
          .regex(/^[A-Z]{2}$/u),
      )
      .max(250)
      .default([]),
    employeeCount: z
      .object({
        min: z.number().int().nonnegative().nullable(),
        max: z.number().int().nonnegative().nullable(),
      })
      .strict()
      .nullable()
      .default(null),
    personaIds: z.array(z.uuid()).max(100).default([]),
    offerIds: z.array(z.uuid()).max(100).default([]),
    minimumScore: z.number().int().min(0).max(100).nullable().default(null),
    maximumScore: z.number().int().min(0).max(100).nullable().default(null),
    languages: z.array(z.string().trim().min(2).max(10)).max(50).default([]),
    problems: z.array(z.string().trim().min(1).max(500)).max(100).default([]),
    intentSignals: z
      .array(z.string().trim().min(1).max(500))
      .max(100)
      .default([]),
    maturityLevels: z
      .array(z.string().trim().min(1).max(100))
      .max(50)
      .default([]),
  })
  .strict()
  .refine(
    ({ minimumScore, maximumScore }) =>
      minimumScore === null ||
      maximumScore === null ||
      minimumScore <= maximumScore,
    { message: "Minimum score cannot exceed maximum score." },
  );

export type ScoreRule = z.infer<typeof scoreRuleSchema>;
export type ScoreModelConfiguration = z.infer<
  typeof scoreModelConfigurationSchema
>;
export type SegmentFilter = z.infer<typeof segmentFilterSchema>;
