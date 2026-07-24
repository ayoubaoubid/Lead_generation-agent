"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

import { createServerStrategyModule } from "@/lib/strategy/server-strategy-module";
import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  createEvidenceSchema,
  createOfferSchema,
  parseStrategyContentForm,
  strategyVersionActionSchema,
} from "@/validations/strategy/strategy-artifact.schema";
import {
  offerFields,
  positioningFields,
} from "@/features/strategy/strategy-field-config";

const artifactTypeSchema = z.enum(["positioning", "offer"]);
const uuidSchema = z.uuid();

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function revalidateStrategyPages() {
  revalidatePath("/strategy");
  revalidatePath("/strategy/positioning");
  revalidatePath("/offers");
}

async function resolveStrategyService() {
  const { supabase, tenant } = await resolveActiveClientTenant([
    "offer.read",
    "offer.write",
  ]);
  return createServerStrategyModule(supabase, tenant);
}

export async function createStrategyDraftAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const artifactType = artifactTypeSchema.safeParse(
    stringField(formData, "artifactType"),
  );
  if (!artifactType.success) {
    return tenantValidationErrorState(artifactType.error);
  }

  const rawName = stringField(formData, "name");
  const name =
    artifactType.data === "positioning"
      ? "Positionnement"
      : createOfferSchema.safeParse({ name: rawName });
  if (typeof name !== "string" && !name.success) {
    return tenantValidationErrorState(name.error);
  }

  const artifactId = stringField(formData, "artifactId");
  if (artifactId && !uuidSchema.safeParse(artifactId).success) {
    return tenantActionErrorState(new Error("Invalid artifact identifier."));
  }

  try {
    const { context, service } = await resolveStrategyService();
    const versionId = await service.createDraft(
      {
        artifactType: artifactType.data,
        name: typeof name === "string" ? name : name.data.name,
        ...(artifactId ? { artifactId } : {}),
      },
      context,
    );
    revalidateStrategyPages();
    return tenantActionSuccessState(
      artifactId
        ? "Une nouvelle version brouillon est disponible."
        : artifactType.data === "positioning"
          ? "Le brouillon de positionnement est prêt."
          : "L’offre a été créée.",
      versionId,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function createStrategyEvidenceAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = createEvidenceSchema.safeParse({
    evidenceType: stringField(formData, "evidenceType"),
    title: stringField(formData, "title"),
    description: stringField(formData, "description"),
    classification: stringField(formData, "classification"),
    sourceUrl: stringField(formData, "sourceUrl"),
    sourceReference: stringField(formData, "sourceReference"),
  });
  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const { context, service } = await resolveStrategyService();
    const evidenceId = await service.createEvidence(parsed.data, context);
    revalidateStrategyPages();
    return tenantActionSuccessState("La preuve a été enregistrée.", evidenceId);
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function saveStrategyDraftAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const artifactType = artifactTypeSchema.safeParse(
    stringField(formData, "artifactType"),
  );
  if (!artifactType.success) {
    return tenantValidationErrorState(artifactType.error);
  }

  const parsed = strategyVersionActionSchema.safeParse({
    versionId: stringField(formData, "versionId"),
    name: stringField(formData, "name"),
  });
  if (!parsed.success || !parsed.data.versionId) {
    return parsed.success
      ? tenantActionErrorState(new Error("Missing version identifier."))
      : tenantValidationErrorState(parsed.error);
  }

  try {
    const fields =
      artifactType.data === "positioning" ? positioningFields : offerFields;
    const content = parseStrategyContentForm(
      formData,
      artifactType.data,
      fields,
    );
    const { context, service } = await resolveStrategyService();
    const versionId = await service.saveDraft(
      {
        artifactType: artifactType.data,
        versionId: parsed.data.versionId,
        name: parsed.data.name,
        content,
      },
      context,
    );
    revalidateStrategyPages();
    return tenantActionSuccessState(
      "Le brouillon a été sauvegardé.",
      versionId,
    );
  } catch (error) {
    return error instanceof ZodError
      ? tenantValidationErrorState(error)
      : tenantActionErrorState(error);
  }
}

export async function validateStrategyVersionAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const artifactType = artifactTypeSchema.safeParse(
    stringField(formData, "artifactType"),
  );
  const versionId = uuidSchema.safeParse(stringField(formData, "versionId"));
  if (!artifactType.success || !versionId.success) {
    return tenantActionErrorState(new Error("Invalid validation request."));
  }

  try {
    const { context, service } = await resolveStrategyService();
    await service.validateVersion(
      { artifactType: artifactType.data, versionId: versionId.data },
      context,
    );
    revalidateStrategyPages();
    return tenantActionSuccessState(
      "La version a été validée humainement et verrouillée.",
      versionId.data,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
