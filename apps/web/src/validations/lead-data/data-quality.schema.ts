import { z } from "zod";

import {
  dataFactStatuses,
  dataVerificationStatuses,
} from "@/domain/lead-data/data-quality";

export const dataFactStatusSchema = z.enum(dataFactStatuses);
export const dataVerificationStatusSchema = z.enum(dataVerificationStatuses);
export const confidenceScoreSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.coerce.number().int().min(0).max(100).nullable(),
);

export const optionalTrimmedText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null);
