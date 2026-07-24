"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui";
import type { OnboardingStatus } from "@/domain/onboarding/onboarding";
import { updateOnboardingLifecycleAction } from "@/features/onboarding/onboarding.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function OnboardingLifecycleActions({
  canValidate,
  canWrite,
  completedStepCount,
  status,
}: Readonly<{
  canValidate: boolean;
  canWrite: boolean;
  completedStepCount: number;
  status: OnboardingStatus;
}>) {
  const [state, action, pending] = useActionState(
    updateOnboardingLifecycleAction,
    initialTenantActionState,
  );

  return (
    <div className="onboarding-lifecycle">
      {status === "draft" && canWrite ? (
        <form action={action}>
          <Button
            disabled={completedStepCount !== 14}
            iconLeading={<CheckCircle2 aria-hidden size={15} />}
            loading={pending}
            name="intent"
            type="submit"
            value="complete_onboarding"
          >
            Soumettre pour validation
          </Button>
        </form>
      ) : null}
      {status === "completed" && canValidate ? (
        <form action={action}>
          <Button
            iconLeading={<ShieldCheck aria-hidden size={15} />}
            loading={pending}
            name="intent"
            type="submit"
            value="validate_onboarding"
          >
            Valider l’onboarding
          </Button>
        </form>
      ) : null}
      {state.message ? (
        <p
          className={`onboarding-form-message onboarding-form-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
