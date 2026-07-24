"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { createServerOnboardingModule } from "@/lib/onboarding/server-onboarding-module";
import {
  tenantActionErrorState,
  tenantActionSuccessState,
  tenantValidationErrorState,
} from "@/lib/actions/tenant-action-state";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import type { TenantActionState } from "@/types/tenant-action-state";
import {
  onboardingActionSchema,
  onboardingLifecycleActionSchema,
  onboardingSectionInputKeys,
  parseOnboardingSectionInput,
} from "@/validations/onboarding/onboarding.schema";

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function saveOnboardingStepAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsedAction = onboardingActionSchema.safeParse({
    sectionKey: stringField(formData, "sectionKey"),
    currentStep: stringField(formData, "currentStep"),
    intent: stringField(formData, "intent"),
  });

  if (!parsedAction.success) {
    return tenantValidationErrorState(parsedAction.error);
  }

  const rawFields = Object.fromEntries(
    onboardingSectionInputKeys[parsedAction.data.sectionKey].map(
      (fieldName) => [fieldName, stringField(formData, fieldName)],
    ),
  );
  const isComplete = parsedAction.data.intent === "complete_step";
  let answerData;

  try {
    answerData = parseOnboardingSectionInput(
      parsedAction.data.sectionKey,
      rawFields,
      isComplete,
    );
  } catch (error) {
    return error instanceof ZodError
      ? tenantValidationErrorState(error)
      : tenantActionErrorState(error);
  }

  try {
    const { supabase, tenant } = await resolveActiveClientTenant([
      "onboarding.read",
      "onboarding.write",
    ]);
    const { context, service } = createServerOnboardingModule(supabase, tenant);
    await service.saveStep(
      {
        sectionKey: parsedAction.data.sectionKey,
        data: answerData,
        isComplete,
        currentStep: parsedAction.data.currentStep,
      },
      context,
    );
  } catch (error) {
    return tenantActionErrorState(error);
  }

  revalidatePath("/strategy");
  revalidatePath("/strategy/onboarding");

  if (isComplete && parsedAction.data.currentStep < 14) {
    redirect(
      `/strategy/onboarding?step=${parsedAction.data.currentStep + 1}&notice=step-saved`,
    );
  }

  return tenantActionSuccessState(
    isComplete ? "L’étape est complète." : "Le brouillon a été sauvegardé.",
  );
}

export async function updateOnboardingLifecycleAction(
  _previousState: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  const parsed = onboardingLifecycleActionSchema.safeParse({
    intent: stringField(formData, "intent"),
  });

  if (!parsed.success) {
    return tenantValidationErrorState(parsed.error);
  }

  try {
    const requiredPermission =
      parsed.data.intent === "validate_onboarding"
        ? "onboarding.validate"
        : "onboarding.write";
    const { supabase, tenant } = await resolveActiveClientTenant([
      "onboarding.read",
      requiredPermission,
    ]);
    const { context, service } = createServerOnboardingModule(supabase, tenant);

    if (parsed.data.intent === "validate_onboarding") {
      await service.validate(context);
    } else {
      await service.complete(context);
    }
  } catch (error) {
    return tenantActionErrorState(error);
  }

  revalidatePath("/strategy");
  revalidatePath("/strategy/onboarding");
  return tenantActionSuccessState(
    parsed.data.intent === "validate_onboarding"
      ? "L’onboarding a été validé."
      : "L’onboarding est prêt pour validation.",
  );
}
