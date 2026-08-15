"use client";

import { Building2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button, Card, FormField, Input } from "@/components/ui";
import { createAgencyAction } from "@/features/agency/agency.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function AgencyCreateForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createAgencyAction,
    initialTenantActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push("/clients");
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="agency-create-form" noValidate>
      <Card className="agency-create-card">
        <div className="agency-card-heading">
          <span className="agency-card-icon" aria-hidden>
            <Building2 size={20} />
          </span>
          <div>
            <h2>Identité de l’agence</h2>
            <p>Vous deviendrez automatiquement Agency Owner de cet espace.</p>
          </div>
        </div>

        <div className="agency-form-grid">
          <FormField
            error={state.fieldErrors?.name?.[0]}
            htmlFor="agency-name"
            label="Nom de l’agence"
          >
            <Input
              autoComplete="organization"
              id="agency-name"
              invalid={Boolean(state.fieldErrors?.name)}
              name="name"
              placeholder="Growth Operations"
              required
            />
          </FormField>
          <FormField
            error={state.fieldErrors?.slug?.[0]}
            hint="Minuscules, chiffres et tirets uniquement."
            htmlFor="agency-slug"
            label="Identifiant technique"
          >
            <Input
              autoCapitalize="none"
              id="agency-slug"
              invalid={Boolean(state.fieldErrors?.slug)}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="growth-operations"
              required
            />
          </FormField>
        </div>

        {state.message ? (
          <p
            className={`agency-action-message agency-action-message--${state.status}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <Button
          disabled={pending}
          iconLeading={
            pending ? (
              <LoaderCircle className="ui-spin" size={16} />
            ) : (
              <Building2 aria-hidden size={16} />
            )
          }
          size="lg"
          type="submit"
        >
          Créer mon agence
        </Button>
      </Card>
    </form>
  );
}
