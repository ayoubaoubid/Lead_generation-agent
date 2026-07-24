"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { Button, Card, FormField, Input, Textarea } from "@/components/ui";
import type { ClientProfile } from "@/domain/clients/client";
import {
  createClientAction,
  updateClientAction,
} from "@/features/clients/client.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";

type ClientProfileFormProps =
  | Readonly<{ mode: "create"; client?: never }>
  | Readonly<{ mode: "update"; client: ClientProfile }>;

const editableStatuses = [
  { value: "draft", label: "Brouillon" },
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Actif" },
  { value: "paused", label: "En pause" },
] as const;

function firstError(
  errors: Readonly<Record<string, string[] | undefined>> | undefined,
  field: string,
): string | undefined {
  return errors?.[field]?.[0];
}

export function ClientProfileForm({ client, mode }: ClientProfileFormProps) {
  const action = mode === "create" ? createClientAction : updateClientAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialTenantActionState,
  );
  const status =
    mode === "create"
      ? "onboarding"
      : client.status === "archived"
        ? "paused"
        : client.status;

  return (
    <form action={formAction} className="client-form">
      {mode === "update" ? (
        <input name="clientId" type="hidden" value={client.id} />
      ) : null}

      <Card className="client-form-section">
        <div className="client-form-section-heading">
          <span>01</span>
          <div>
            <h2>Identité du client</h2>
            <p>Les informations visibles dans tout l’espace agence.</p>
          </div>
        </div>
        <div className="client-form-grid">
          <FormField
            error={firstError(state.fieldErrors, "name")}
            htmlFor="client-name"
            label="Nom commercial"
          >
            <Input
              autoComplete="organization"
              defaultValue={client?.name}
              id="client-name"
              invalid={Boolean(firstError(state.fieldErrors, "name"))}
              name="name"
              placeholder="Acme France"
              required
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "legalName")}
            htmlFor="client-legal-name"
            label="Raison sociale"
            optional
          >
            <Input
              defaultValue={client?.legalName ?? ""}
              id="client-legal-name"
              invalid={Boolean(firstError(state.fieldErrors, "legalName"))}
              name="legalName"
              placeholder="Acme France SAS"
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "slug")}
            hint="Minuscules, chiffres et tirets uniquement."
            htmlFor="client-slug"
            label="Identifiant technique"
          >
            <Input
              autoCapitalize="none"
              defaultValue={client?.slug}
              id="client-slug"
              invalid={Boolean(firstError(state.fieldErrors, "slug"))}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="acme-france"
              required
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "status")}
            htmlFor="client-status"
            label="Statut d’onboarding"
          >
            <select
              className="ui-input client-native-select"
              defaultValue={status}
              id="client-status"
              name="status"
            >
              {(mode === "create"
                ? editableStatuses.slice(0, 2)
                : editableStatuses
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "description")}
            htmlFor="client-description"
            label="Description"
            optional
          >
            <Textarea
              defaultValue={client?.description ?? ""}
              id="client-description"
              invalid={Boolean(firstError(state.fieldErrors, "description"))}
              name="description"
              placeholder="Activité, contexte commercial et points de vigilance…"
              rows={5}
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "logoUrl")}
            hint="URL HTTPS d’un logo hébergé. Aucun fichier n’est téléversé ici."
            htmlFor="client-logo"
            label="Logo"
            optional
          >
            <Input
              defaultValue={client?.logoUrl ?? ""}
              id="client-logo"
              invalid={Boolean(firstError(state.fieldErrors, "logoUrl"))}
              name="logoUrl"
              placeholder="https://cdn.example.com/logo.svg"
              type="url"
            />
          </FormField>
        </div>
      </Card>

      <Card className="client-form-section">
        <div className="client-form-section-heading">
          <span>02</span>
          <div>
            <h2>Marché et localisation</h2>
            <p>Le contexte utilisé pour la stratégie et les campagnes.</p>
          </div>
        </div>
        <div className="client-form-grid client-form-grid--three">
          <FormField
            error={firstError(state.fieldErrors, "websiteUrl")}
            htmlFor="client-website"
            label="Site web"
            optional
          >
            <Input
              defaultValue={client?.websiteUrl ?? ""}
              id="client-website"
              invalid={Boolean(firstError(state.fieldErrors, "websiteUrl"))}
              name="websiteUrl"
              placeholder="https://example.com"
              type="url"
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "industry")}
            htmlFor="client-industry"
            label="Secteur"
            optional
          >
            <Input
              defaultValue={client?.industry ?? ""}
              id="client-industry"
              invalid={Boolean(firstError(state.fieldErrors, "industry"))}
              name="industry"
              placeholder="Logiciels B2B"
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "countryCode")}
            hint="Code ISO à deux lettres."
            htmlFor="client-country"
            label="Pays"
            optional
          >
            <Input
              defaultValue={client?.countryCode ?? ""}
              id="client-country"
              invalid={Boolean(firstError(state.fieldErrors, "countryCode"))}
              maxLength={2}
              name="countryCode"
              placeholder="FR"
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "languageCode")}
            hint="Par exemple fr ou fr-FR."
            htmlFor="client-language"
            label="Langue"
            optional
          >
            <Input
              defaultValue={client?.languageCode ?? ""}
              id="client-language"
              invalid={Boolean(firstError(state.fieldErrors, "languageCode"))}
              name="languageCode"
              placeholder="fr-FR"
            />
          </FormField>
          <FormField
            error={firstError(state.fieldErrors, "timezone")}
            hint="Fuseau IANA."
            htmlFor="client-timezone"
            label="Fuseau horaire"
            optional
          >
            <Input
              defaultValue={client?.timezone ?? ""}
              id="client-timezone"
              invalid={Boolean(firstError(state.fieldErrors, "timezone"))}
              list="client-timezones"
              name="timezone"
              placeholder="Europe/Paris"
            />
            <datalist id="client-timezones">
              <option value="Africa/Casablanca" />
              <option value="Europe/Paris" />
              <option value="Europe/London" />
              <option value="America/New_York" />
              <option value="UTC" />
            </datalist>
          </FormField>
        </div>
      </Card>

      <Card className="client-form-section">
        <div className="client-form-section-heading">
          <span>03</span>
          <div>
            <h2>Objectifs</h2>
            <p>Un objectif par ligne, sans promesse ni résultat inventé.</p>
          </div>
        </div>
        <FormField
          error={firstError(state.fieldErrors, "objectives")}
          htmlFor="client-objectives"
          label="Objectifs commerciaux"
          optional
        >
          <Textarea
            defaultValue={client?.objectives.join("\n") ?? ""}
            id="client-objectives"
            invalid={Boolean(firstError(state.fieldErrors, "objectives"))}
            name="objectives"
            placeholder={
              "Développer le pipeline sur le marché français\nQualifier les comptes prioritaires"
            }
            rows={6}
          />
        </FormField>
      </Card>

      {state.message ? (
        <p
          className={`client-form-message client-form-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <div className="client-form-actions">
        <Button
          iconLeading={<Save aria-hidden size={16} />}
          loading={pending}
          size="lg"
          type="submit"
        >
          {mode === "create" ? "Créer le client" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
