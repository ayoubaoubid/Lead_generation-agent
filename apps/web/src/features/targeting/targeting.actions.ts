"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { createServerTargetingModule } from "@/lib/targeting/server-targeting-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import { GroqTargetingProposalAdapter } from "@/services/targeting/groq-targeting-proposal.adapter";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  parseTargetingContentForm,
  targetingLifecycleSchema,
  targetingNameSchema,
  targetingObjectiveSchema,
  targetingProfileTypeSchema,
} from "@/validations/targeting/targeting-profile.schema";

const uuidSchema = z.uuid();

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function refreshTargetingPage() {
  revalidatePath("/icp-personas");
}

async function resolveTargetingService(
  permissions: "targeting.write" | "targeting.validate" | "targeting.propose",
) {
  const { supabase, tenant } = await resolveActiveClientTenant([
    "targeting.read",
    permissions,
  ]);
  return createServerTargetingModule(supabase, tenant);
}

export async function createTargetingDraftAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z
    .object({
      profileType: targetingProfileTypeSchema,
      name: targetingNameSchema,
      sourceProfileId: z.union([z.literal(""), uuidSchema]),
    })
    .safeParse({
      profileType: stringField(formData, "profileType"),
      name: stringField(formData, "name"),
      sourceProfileId: stringField(formData, "sourceProfileId"),
    });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { context, service } =
      await resolveTargetingService("targeting.write");
    const id = await service.createDraft(
      {
        profileType: parsed.data.profileType,
        name: parsed.data.name,
        ...(parsed.data.sourceProfileId
          ? { sourceProfileId: parsed.data.sourceProfileId }
          : {}),
      },
      context,
    );
    refreshTargetingPage();
    return tenantActionSuccessState(
      parsed.data.sourceProfileId
        ? "Le profil a été dupliqué dans un nouveau brouillon."
        : "Le brouillon a été créé.",
      id,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function createTargetingVersionAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z
    .object({
      profileType: targetingProfileTypeSchema,
      profileId: uuidSchema,
    })
    .safeParse({
      profileType: stringField(formData, "profileType"),
      profileId: stringField(formData, "profileId"),
    });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { context, service } =
      await resolveTargetingService("targeting.write");
    const id = await service.createVersion(parsed.data, context);
    refreshTargetingPage();
    return tenantActionSuccessState(
      "Une nouvelle version brouillon est disponible.",
      id,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function saveTargetingDraftAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z
    .object({
      profileType: targetingProfileTypeSchema,
      versionId: uuidSchema,
      name: targetingNameSchema,
    })
    .safeParse({
      profileType: stringField(formData, "profileType"),
      versionId: stringField(formData, "versionId"),
      name: stringField(formData, "name"),
    });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const content =
      parsed.data.profileType === "icp"
        ? parseTargetingContentForm(formData, "icp")
        : parseTargetingContentForm(formData, "persona");
    const { context, service } =
      await resolveTargetingService("targeting.write");
    const id = await service.saveDraft({ ...parsed.data, content }, context);
    refreshTargetingPage();
    return tenantActionSuccessState("Le brouillon a été sauvegardé.", id);
  } catch (error) {
    return error instanceof ZodError
      ? tenantValidationErrorState(error)
      : tenantActionErrorState(error);
  }
}

export async function validateTargetingVersionAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z
    .object({
      profileType: targetingProfileTypeSchema,
      versionId: uuidSchema,
    })
    .safeParse({
      profileType: stringField(formData, "profileType"),
      versionId: stringField(formData, "versionId"),
    });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { context, service } =
      await resolveTargetingService("targeting.validate");
    const id = await service.validateVersion(parsed.data, context);
    refreshTargetingPage();
    return tenantActionSuccessState(
      "La version a été validée humainement et verrouillée.",
      id,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function setTargetingLifecycleAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z
    .object({
      profileType: targetingProfileTypeSchema,
      profileId: uuidSchema,
      lifecycleStatus: targetingLifecycleSchema.refine(
        (value) => value === "active" || value === "archived",
      ),
    })
    .safeParse({
      profileType: stringField(formData, "profileType"),
      profileId: stringField(formData, "profileId"),
      lifecycleStatus: stringField(formData, "lifecycleStatus"),
    });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  const lifecycleStatus = parsed.data.lifecycleStatus;
  if (lifecycleStatus !== "active" && lifecycleStatus !== "archived") {
    return tenantActionErrorState(new Error("Invalid lifecycle transition."));
  }

  try {
    const { context, service } = await resolveTargetingService(
      lifecycleStatus === "active" ? "targeting.validate" : "targeting.write",
    );
    const id = await service.setLifecycle(
      { ...parsed.data, lifecycleStatus },
      context,
    );
    refreshTargetingPage();
    return tenantActionSuccessState(
      lifecycleStatus === "active"
        ? "Le profil validé est maintenant actif."
        : "Le profil a été archivé.",
      id,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}

export async function proposeTargetingWithAiAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = z
    .object({
      profileType: targetingProfileTypeSchema,
      objective: targetingObjectiveSchema,
    })
    .safeParse({
      profileType: stringField(formData, "profileType"),
      objective: stringField(formData, "objective"),
    });
  if (!parsed.success) return tenantValidationErrorState(parsed.error);

  try {
    const { context, service } =
      await resolveTargetingService("targeting.propose");
    const workspace = await service.findWorkspace(
      parsed.data.profileType,
      context,
    );
    const proposal = await new GroqTargetingProposalAdapter().propose({
      ...parsed.data,
      existingProfileNames: workspace.profiles.map(({ name }) => name),
    });
    const first = proposal.profiles[0];
    if (!first) {
      throw new Error("La proposition IA ne contient aucun profil.");
    }
    const id = await service.createAiProposal(
      {
        profileType: parsed.data.profileType,
        name: first.name,
        content: first.content,
        executionId: proposal.executionId,
        modelId: proposal.modelId,
        skillVersion: proposal.skillVersion,
        promptVersion: proposal.promptVersion,
        inputTokens: proposal.inputTokens,
        outputTokens: proposal.outputTokens,
        costMicrousd: proposal.costMicrousd,
        pricingVersion: proposal.pricingVersion,
      },
      context,
    );
    refreshTargetingPage();
    return tenantActionSuccessState(
      "La proposition IA a été enregistrée comme brouillon à vérifier.",
      id,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }
}
