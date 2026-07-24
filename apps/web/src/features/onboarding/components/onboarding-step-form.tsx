"use client";

import { ArrowRight, Save } from "lucide-react";
import { useActionState } from "react";

import { Button, FormField, Input, Textarea } from "@/components/ui";
import type {
  OnboardingAnswer,
  OnboardingStatus,
} from "@/domain/onboarding/onboarding";
import { saveOnboardingStepAction } from "@/features/onboarding/onboarding.actions";
import type { OnboardingSectionConfig } from "@/features/onboarding/onboarding-section-config";
import { initialTenantActionState } from "@/types/tenant-action-state";
import { serializeOnboardingFieldValue } from "@/validations/onboarding/onboarding.schema";

export function OnboardingStepForm({
  answer,
  canWrite,
  config,
  status,
  step,
}: Readonly<{
  answer: OnboardingAnswer | undefined;
  canWrite: boolean;
  config: OnboardingSectionConfig;
  status: OnboardingStatus;
  step: number;
}>) {
  const [state, action, pending] = useActionState(
    saveOnboardingStepAction,
    initialTenantActionState,
  );
  const readOnly = !canWrite || status === "validated";

  return (
    <form action={action} className="onboarding-form">
      <input name="sectionKey" type="hidden" value={config.key} />
      <input name="currentStep" type="hidden" value={step} />

      <div className="onboarding-form-heading">
        <div>
          <span>
            Étape {step} sur 14
            {answer ? ` · Révision ${answer.revision}` : ""}
          </span>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
      </div>

      <div className="onboarding-fields">
        {config.fields.map((field) => {
          const value = serializeOnboardingFieldValue(answer?.data[field.name]);
          const error = state.fieldErrors?.[field.name]?.[0];
          const commonProps = {
            defaultValue: value,
            disabled: readOnly || pending,
            id: `onboarding-${field.name}`,
            invalid: Boolean(error),
            name: field.name,
            placeholder: field.placeholder,
          };

          return (
            <FormField
              error={error}
              htmlFor={commonProps.id}
              key={field.name}
              label={field.label}
              {...(field.hint ? { hint: field.hint } : {})}
              {...(field.optional === undefined
                ? {}
                : { optional: field.optional })}
            >
              {field.kind === "textarea" || field.kind === "list" ? (
                <Textarea
                  {...commonProps}
                  rows={field.kind === "list" ? 5 : 6}
                />
              ) : field.kind === "select" ? (
                <select
                  aria-invalid={commonProps.invalid || undefined}
                  className="ui-input"
                  defaultValue={value || field.options?.[0]?.value}
                  disabled={commonProps.disabled}
                  id={commonProps.id}
                  name={field.name}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  {...commonProps}
                  min={field.kind === "number" ? 0 : undefined}
                  step={field.kind === "number" ? "any" : undefined}
                  type={
                    field.kind === "url"
                      ? "url"
                      : field.kind === "number"
                        ? "number"
                        : field.kind === "date"
                          ? "date"
                          : "text"
                  }
                />
              )}
            </FormField>
          );
        })}
      </div>

      {state.message ? (
        <p
          className={`onboarding-form-message onboarding-form-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <div className="onboarding-form-actions">
        {readOnly ? (
          <p>
            {status === "validated"
              ? "Cette version validée est verrouillée."
              : "Vous disposez d’un accès en lecture seule."}
          </p>
        ) : (
          <>
            <Button
              disabled={pending}
              iconLeading={<Save aria-hidden size={15} />}
              name="intent"
              type="submit"
              value="save_draft"
              variant="secondary"
            >
              Sauvegarder le brouillon
            </Button>
            <Button
              disabled={pending}
              iconTrailing={<ArrowRight aria-hidden size={15} />}
              loading={pending}
              name="intent"
              type="submit"
              value="complete_step"
            >
              Valider l’étape
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
