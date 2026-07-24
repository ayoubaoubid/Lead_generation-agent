"use client";

import { Archive, CheckCircle2, Play, Save, Split } from "lucide-react";
import { useActionState } from "react";

import { Badge, Button, FormField, Input, Textarea } from "@/components/ui";
import {
  scoringCriteria,
  type IcpContent,
  type PersonaContent,
  type TargetingProfile,
  type TargetingVersion,
} from "@/domain/targeting/targeting-profile";
import { TargetingActionMessage } from "@/features/targeting/components/targeting-action-message";
import {
  createTargetingVersionAction,
  saveTargetingDraftAction,
  setTargetingLifecycleAction,
  validateTargetingVersionAction,
} from "@/features/targeting/targeting.actions";
import { initialTenantActionState } from "@/types/tenant-action-state";
import {
  icpContentSchema,
  personaContentSchema,
} from "@/validations/targeting/targeting-profile.schema";

const scoringLabels = {
  industry: "Secteur",
  country: "Pays",
  company_size: "Taille",
  employee_count: "Effectif",
  annual_revenue: "Chiffre d’affaires",
  technology: "Technologies",
  maturity: "Maturité",
  budget: "Budget",
  problem: "Problèmes",
  intent_signal: "Signaux d’intention",
} as const;

const icpTextFields = [
  ["rationale", "Raisonnement", "Pourquoi ce profil mérite d’être testé"],
  ["industries", "Secteurs", "Un secteur par ligne"],
  ["countries", "Pays", "Un pays ou marché par ligne"],
  ["companySizes", "Tailles d’entreprise", "Ex. PME, ETI"],
  ["technologies", "Technologies", "Technologies observées ou recherchées"],
  ["maturityLevels", "Maturité", "Maturité du besoin ou du processus"],
  ["problems", "Problèmes", "Problèmes observables et formulés"],
  [
    "intentSignals",
    "Signaux d’intention",
    "Événements ou comportements observables",
  ],
  ["exclusions", "Exclusions", "Cas qui ne doivent pas être ciblés"],
  ["assumptions", "Hypothèses", "Déductions qui restent à tester"],
  [
    "missingEvidence",
    "Preuves manquantes",
    "Ce qu’il faut vérifier avant activation",
  ],
] as const;

const personaTextFields = [
  ["rationale", "Raisonnement", "Pourquoi ce persona mérite d’être testé"],
  ["jobTitles", "Postes", "Intitulés de poste observés"],
  ["departments", "Départements", "Ex. Sales, Operations"],
  [
    "seniorityLevels",
    "Niveaux hiérarchiques",
    "Ex. C-level, direction, manager",
  ],
  ["responsibilities", "Responsabilités", "Responsabilités concrètes"],
  ["goals", "Objectifs", "Résultats recherchés"],
  ["problems", "Problèmes", "Difficultés observables"],
  ["objections", "Objections", "Objections réellement entendues ou à tester"],
  ["buyingRoles", "Rôles dans l’achat", "Décideur, prescripteur, utilisateur…"],
  ["preferredChannels", "Canaux préférés", "Canaux observés, pas supposés"],
  ["assumptions", "Hypothèses", "Déductions qui restent à tester"],
  ["missingEvidence", "Preuves manquantes", "Ce qu’il faut vérifier"],
] as const;

function lines(values: readonly string[]): string {
  return values.join("\n");
}

function IcpFields({
  content,
  disabled,
}: Readonly<{ content: IcpContent; disabled: boolean }>) {
  return (
    <>
      <div className="targeting-field-grid">
        {icpTextFields.map(([key, label, hint]) => (
          <FormField
            hint={hint}
            htmlFor={`targeting-${key}`}
            key={key}
            label={label}
          >
            <Textarea
              defaultValue={lines(content[key])}
              disabled={disabled}
              id={`targeting-${key}`}
              name={key}
              placeholder="Un élément par ligne"
              rows={4}
            />
          </FormField>
        ))}
      </div>
      <div className="targeting-range-grid">
        <RangeFields
          disabled={disabled}
          label="Effectif"
          max={content.employeeCount.max}
          min={content.employeeCount.min}
          name="employeeCount"
        />
        <RangeFields
          currencyCode={content.annualRevenue.currencyCode}
          disabled={disabled}
          label="Chiffre d’affaires annuel"
          max={content.annualRevenue.max}
          min={content.annualRevenue.min}
          name="annualRevenue"
        />
        <RangeFields
          currencyCode={content.budget.currencyCode}
          disabled={disabled}
          label="Budget"
          max={content.budget.max}
          min={content.budget.min}
          name="budget"
        />
      </div>
      <fieldset className="targeting-score-grid">
        <legend>Poids de scoring · total attendu : 100</legend>
        {scoringCriteria.map((criterion) => (
          <FormField
            htmlFor={`scoring-${criterion}`}
            key={criterion}
            label={scoringLabels[criterion]}
          >
            <Input
              defaultValue={
                content.scoringWeights.find(
                  (item) => item.criterion === criterion,
                )?.weight ?? ""
              }
              disabled={disabled}
              id={`scoring-${criterion}`}
              max={100}
              min={0}
              name={`scoring.${criterion}`}
              type="number"
            />
          </FormField>
        ))}
      </fieldset>
    </>
  );
}

function RangeFields({
  currencyCode,
  disabled,
  label,
  max,
  min,
  name,
}: Readonly<{
  currencyCode?: string;
  disabled: boolean;
  label: string;
  max: number | null;
  min: number | null;
  name: string;
}>) {
  return (
    <fieldset className="targeting-range">
      <legend>{label}</legend>
      <FormField htmlFor={`${name}-min`} label="Minimum" optional>
        <Input
          defaultValue={min ?? ""}
          disabled={disabled}
          id={`${name}-min`}
          min={0}
          name={`${name}.min`}
          type="number"
        />
      </FormField>
      <FormField htmlFor={`${name}-max`} label="Maximum" optional>
        <Input
          defaultValue={max ?? ""}
          disabled={disabled}
          id={`${name}-max`}
          min={0}
          name={`${name}.max`}
          type="number"
        />
      </FormField>
      {currencyCode !== undefined ? (
        <FormField htmlFor={`${name}-currency`} label="Devise ISO" optional>
          <Input
            defaultValue={currencyCode}
            disabled={disabled}
            id={`${name}-currency`}
            maxLength={3}
            name={`${name}.currencyCode`}
            placeholder="EUR"
          />
        </FormField>
      ) : null}
    </fieldset>
  );
}

function PersonaFields({
  content,
  disabled,
}: Readonly<{ content: PersonaContent; disabled: boolean }>) {
  return (
    <>
      <div className="targeting-field-grid">
        {personaTextFields.map(([key, label, hint]) => (
          <FormField
            hint={hint}
            htmlFor={`targeting-${key}`}
            key={key}
            label={label}
          >
            <Textarea
              defaultValue={lines(content[key])}
              disabled={disabled}
              id={`targeting-${key}`}
              name={key}
              placeholder="Un élément par ligne"
              rows={4}
            />
          </FormField>
        ))}
      </div>
      <FormField htmlFor="targeting-decision-power" label="Pouvoir de décision">
        <select
          className="ui-input"
          defaultValue={content.decisionPower}
          disabled={disabled}
          id="targeting-decision-power"
          name="decisionPower"
        >
          <option value="unknown">À vérifier</option>
          <option value="low">Faible</option>
          <option value="medium">Intermédiaire</option>
          <option value="high">Élevé</option>
        </select>
      </FormField>
    </>
  );
}

export function TargetingEditor({
  canValidate,
  canWrite,
  profile,
  version,
}: Readonly<{
  canValidate: boolean;
  canWrite: boolean;
  profile: TargetingProfile;
  version: TargetingVersion;
}>) {
  const [saveState, saveAction, savePending] = useActionState(
    saveTargetingDraftAction,
    initialTenantActionState,
  );
  const [validateState, validateAction, validatePending] = useActionState(
    validateTargetingVersionAction,
    initialTenantActionState,
  );
  const [versionState, versionAction, versionPending] = useActionState(
    createTargetingVersionAction,
    initialTenantActionState,
  );
  const [lifecycleState, lifecycleAction, lifecyclePending] = useActionState(
    setTargetingLifecycleAction,
    initialTenantActionState,
  );
  const readOnly =
    version.status === "validated" ||
    profile.lifecycleStatus === "archived" ||
    !canWrite;
  const content =
    profile.profileType === "icp"
      ? icpContentSchema.parse(version.content)
      : personaContentSchema.parse(version.content);
  const hasDraft = profile.versions.some(({ status }) => status === "draft");
  const latest = profile.versions[0]?.id === version.id;

  return (
    <article className="targeting-editor">
      <header className="targeting-editor-header">
        <div>
          <span>
            Version {version.versionNumber} ·{" "}
            {version.origin === "ai_proposal"
              ? "proposition IA"
              : version.origin === "duplicate"
                ? "copie"
                : "manuel"}
          </span>
          <h2>{profile.name}</h2>
        </div>
        <div className="targeting-statuses">
          <Badge tone={version.status === "validated" ? "success" : "warning"}>
            {version.status === "validated" ? "Validée" : "Brouillon"}
          </Badge>
          <Badge
            tone={
              profile.lifecycleStatus === "active"
                ? "success"
                : profile.lifecycleStatus === "archived"
                  ? "danger"
                  : "neutral"
            }
          >
            {profile.lifecycleStatus === "active"
              ? "Actif"
              : profile.lifecycleStatus === "archived"
                ? "Archivé"
                : "Inactif"}
          </Badge>
        </div>
      </header>

      {version.origin === "ai_proposal" ? (
        <div className="targeting-provenance">
          <strong>Provenance IA traçable</strong>
          <span>
            {version.aiModelId} · skill {version.aiSkillName}{" "}
            {version.aiSkillVersion} · {version.aiInputTokens ?? 0} tokens
            entrée / {version.aiOutputTokens ?? 0} sortie
          </span>
        </div>
      ) : null}

      <form action={saveAction} className="targeting-editor-form">
        <input name="profileType" type="hidden" value={profile.profileType} />
        <input name="versionId" type="hidden" value={version.id} />
        <FormField htmlFor="targeting-profile-name" label="Nom du profil">
          <Input
            defaultValue={profile.name}
            disabled={readOnly || savePending}
            id="targeting-profile-name"
            maxLength={160}
            name="name"
            required
          />
        </FormField>
        {profile.profileType === "icp" ? (
          <IcpFields
            content={icpContentSchema.parse(content)}
            disabled={readOnly || savePending}
          />
        ) : (
          <PersonaFields
            content={personaContentSchema.parse(content)}
            disabled={readOnly || savePending}
          />
        )}
        {!readOnly ? (
          <Button
            iconLeading={<Save aria-hidden size={15} />}
            loading={savePending}
            type="submit"
            variant="secondary"
          >
            Sauvegarder
          </Button>
        ) : (
          <p className="targeting-readonly">
            {version.status === "validated"
              ? "Cette version validée est immuable."
              : "Ce profil est accessible en lecture seule."}
          </p>
        )}
        <TargetingActionMessage state={saveState} />
      </form>

      <div className="targeting-workflow-actions">
        {version.status === "draft" &&
        profile.lifecycleStatus !== "archived" &&
        canValidate ? (
          <form action={validateAction}>
            <input
              name="profileType"
              type="hidden"
              value={profile.profileType}
            />
            <input name="versionId" type="hidden" value={version.id} />
            <Button
              iconLeading={<CheckCircle2 aria-hidden size={15} />}
              loading={validatePending}
              type="submit"
            >
              Valider humainement
            </Button>
            <TargetingActionMessage state={validateState} />
          </form>
        ) : null}

        {!hasDraft && profile.lifecycleStatus !== "archived" && canWrite ? (
          <form action={versionAction}>
            <input
              name="profileType"
              type="hidden"
              value={profile.profileType}
            />
            <input name="profileId" type="hidden" value={profile.id} />
            <Button
              iconLeading={<Split aria-hidden size={15} />}
              loading={versionPending}
              type="submit"
              variant="secondary"
            >
              Nouvelle version
            </Button>
            <TargetingActionMessage state={versionState} />
          </form>
        ) : null}

        {latest &&
        !hasDraft &&
        version.status === "validated" &&
        profile.lifecycleStatus !== "active" &&
        profile.lifecycleStatus !== "archived" &&
        canValidate ? (
          <form action={lifecycleAction}>
            <input
              name="profileType"
              type="hidden"
              value={profile.profileType}
            />
            <input name="profileId" type="hidden" value={profile.id} />
            <input name="lifecycleStatus" type="hidden" value="active" />
            <Button
              iconLeading={<Play aria-hidden size={15} />}
              loading={lifecyclePending}
              type="submit"
            >
              Activer
            </Button>
          </form>
        ) : null}

        {profile.lifecycleStatus !== "archived" && canWrite ? (
          <form action={lifecycleAction}>
            <input
              name="profileType"
              type="hidden"
              value={profile.profileType}
            />
            <input name="profileId" type="hidden" value={profile.id} />
            <input name="lifecycleStatus" type="hidden" value="archived" />
            <Button
              iconLeading={<Archive aria-hidden size={15} />}
              loading={lifecyclePending}
              type="submit"
              variant="ghost"
            >
              Archiver
            </Button>
          </form>
        ) : null}
        <TargetingActionMessage state={lifecycleState} />
      </div>
    </article>
  );
}
