"use client";

import { Save, ShieldCheck } from "lucide-react";
import { useActionState } from "react";

import { Badge, Button, FormField, Textarea } from "@/components/ui";
import type {
  StrategyArtifact,
  StrategyArtifactType,
  StrategyEvidence,
  StrategyVersion,
} from "@/domain/strategy/strategy-artifact";
import { StrategyActionMessage } from "@/features/strategy/components/strategy-action-message";
import {
  saveStrategyDraftAction,
  validateStrategyVersionAction,
} from "@/features/strategy/strategy.actions";
import type { StrategyFieldDefinition } from "@/validations/strategy/strategy-artifact.schema";
import { initialTenantActionState } from "@/types/tenant-action-state";

const classificationOptions = [
  { value: "confirmed", label: "Confirmé" },
  { value: "inferred", label: "Inféré" },
  { value: "hypothesis", label: "Hypothèse" },
  { value: "missing", label: "Manquant" },
] as const;

export function StrategyVersionEditor({
  artifact,
  artifactType,
  canWrite,
  evidence,
  fields,
  version,
}: Readonly<{
  artifact: StrategyArtifact;
  artifactType: StrategyArtifactType;
  canWrite: boolean;
  evidence: readonly StrategyEvidence[];
  fields: readonly StrategyFieldDefinition[];
  version: StrategyVersion;
}>) {
  const [saveState, saveAction, savePending] = useActionState(
    saveStrategyDraftAction,
    initialTenantActionState,
  );
  const [validationState, validationAction, validationPending] = useActionState(
    validateStrategyVersionAction,
    initialTenantActionState,
  );
  const readOnly = version.status === "validated" || !canWrite;

  return (
    <section className="strategy-editor">
      <div className="strategy-editor-heading">
        <div>
          <span>Version {version.versionNumber}</span>
          <h2>{artifact.name}</h2>
        </div>
        <Badge tone={version.status === "validated" ? "success" : "warning"}>
          {version.status === "validated" ? "Validée" : "Brouillon"}
        </Badge>
      </div>

      <form action={saveAction}>
        <input name="artifactType" type="hidden" value={artifactType} />
        <input name="versionId" type="hidden" value={version.id} />
        <input name="name" type="hidden" value={artifact.name} />
        <div className="strategy-fields">
          {fields.map((field) => {
            const items = version.content.filter(
              (item) => item.kind === field.kind,
            );
            const first = items[0];
            const fieldId = `${version.id}-${field.kind}`;
            return (
              <div className="strategy-field-card" key={field.kind}>
                <div className="strategy-field-heading">
                  <FormField
                    hint={field.description}
                    htmlFor={`${fieldId}-value`}
                    label={field.label}
                    optional={!field.requiredForValidation}
                  >
                    <Textarea
                      defaultValue={items.map((item) => item.value).join("\n")}
                      disabled={readOnly || savePending}
                      id={`${fieldId}-value`}
                      name={`${field.kind}.value`}
                      placeholder="Un élément par ligne"
                      rows={4}
                    />
                  </FormField>
                </div>
                <div className="strategy-field-metadata">
                  <FormField
                    htmlFor={`${fieldId}-classification`}
                    label="Qualification"
                  >
                    <select
                      className="ui-input"
                      defaultValue={first?.classification ?? "missing"}
                      disabled={readOnly || savePending}
                      id={`${fieldId}-classification`}
                      name={`${field.kind}.classification`}
                    >
                      {classificationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    htmlFor={`${fieldId}-evidence`}
                    label="Preuve associée"
                    optional
                  >
                    <select
                      className="ui-input"
                      defaultValue={first?.evidenceIds[0] ?? ""}
                      disabled={readOnly || savePending}
                      id={`${fieldId}-evidence`}
                      name={`${field.kind}.evidenceId`}
                    >
                      <option value="">Aucune preuve</option>
                      {evidence.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title} · {item.classification}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
        {!readOnly ? (
          <div className="strategy-editor-actions">
            <Button
              iconLeading={<Save aria-hidden size={15} />}
              loading={savePending}
              type="submit"
              variant="secondary"
            >
              Sauvegarder le brouillon
            </Button>
          </div>
        ) : (
          <p className="strategy-readonly-note">
            {version.status === "validated"
              ? "Cette version validée est immuable."
              : "Vous disposez d’un accès en lecture seule."}
          </p>
        )}
        <StrategyActionMessage state={saveState} />
      </form>

      {version.status === "draft" && canWrite ? (
        <form action={validationAction} className="strategy-validation-form">
          <input name="artifactType" type="hidden" value={artifactType} />
          <input name="versionId" type="hidden" value={version.id} />
          <div>
            <strong>Validation humaine requise</strong>
            <p>
              Vérifiez chaque qualification et chaque preuve avant de
              verrouiller cette version.
            </p>
          </div>
          <Button
            iconLeading={<ShieldCheck aria-hidden size={15} />}
            loading={validationPending}
            type="submit"
          >
            Valider et verrouiller
          </Button>
          <StrategyActionMessage state={validationState} />
        </form>
      ) : null}
    </section>
  );
}
