"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, FormField, Input } from "@/components/ui";

import {
  changePasswordAction,
  forgotPasswordAction,
  signInAction,
  updatePasswordAction,
  updateProfileAction,
  verifyMfaAction,
} from "./auth.actions";
import {
  initialAuthActionState,
  type AuthActionState,
} from "./auth-action-state";

function fieldError(state: AuthActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function SubmitButton({ children }: Readonly<{ children: string }>) {
  const { pending } = useFormStatus();
  return (
    <Button className="auth-submit" loading={pending} size="lg" type="submit">
      {children}
    </Button>
  );
}

function ActionFeedback({ state }: Readonly<{ state: AuthActionState }>) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      className={`auth-feedback auth-feedback--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

export function SignInForm({ nextPath }: Readonly<{ nextPath: string }>) {
  const [state, formAction] = useActionState(
    signInAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="auth-form" noValidate>
      <input name="next" type="hidden" value={nextPath} />
      <FormField
        error={fieldError(state, "email") ?? ""}
        htmlFor="email"
        label="Adresse email"
      >
        <Input
          autoComplete="email"
          id="email"
          invalid={Boolean(fieldError(state, "email"))}
          name="email"
          placeholder="vous@entreprise.com"
          required
          type="email"
        />
      </FormField>
      <FormField
        error={fieldError(state, "password") ?? ""}
        htmlFor="password"
        label="Mot de passe"
      >
        <Input
          autoComplete="current-password"
          id="password"
          invalid={Boolean(fieldError(state, "password"))}
          name="password"
          required
          type="password"
        />
      </FormField>
      <ActionFeedback state={state} />
      <SubmitButton>Se connecter</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="auth-form" noValidate>
      <FormField
        error={fieldError(state, "email") ?? ""}
        hint="Nous affichons toujours la même confirmation pour protéger les comptes."
        htmlFor="email"
        label="Adresse email"
      >
        <Input
          autoComplete="email"
          id="email"
          invalid={Boolean(fieldError(state, "email"))}
          name="email"
          placeholder="vous@entreprise.com"
          required
          type="email"
        />
      </FormField>
      <ActionFeedback state={state} />
      <SubmitButton>Envoyer les instructions</SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="auth-form" noValidate>
      <FormField
        error={fieldError(state, "password") ?? ""}
        hint="12 caractères minimum, avec majuscule, minuscule et chiffre."
        htmlFor="password"
        label="Nouveau mot de passe"
      >
        <Input
          autoComplete="new-password"
          id="password"
          invalid={Boolean(fieldError(state, "password"))}
          name="password"
          required
          type="password"
        />
      </FormField>
      <FormField
        error={fieldError(state, "passwordConfirmation") ?? ""}
        htmlFor="passwordConfirmation"
        label="Confirmer le mot de passe"
      >
        <Input
          autoComplete="new-password"
          id="passwordConfirmation"
          invalid={Boolean(fieldError(state, "passwordConfirmation"))}
          name="passwordConfirmation"
          required
          type="password"
        />
      </FormField>
      <ActionFeedback state={state} />
      <SubmitButton>Enregistrer le mot de passe</SubmitButton>
    </form>
  );
}

export function MfaVerificationForm({
  factorId,
}: Readonly<{ factorId: string }>) {
  const [state, formAction] = useActionState(
    verifyMfaAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="auth-form" noValidate>
      <input name="factorId" type="hidden" value={factorId} />
      <FormField
        error={fieldError(state, "code") ?? ""}
        hint="Ouvrez votre application d’authentification."
        htmlFor="code"
        label="Code de vérification"
      >
        <Input
          autoComplete="one-time-code"
          id="code"
          inputMode="numeric"
          invalid={Boolean(fieldError(state, "code"))}
          maxLength={6}
          name="code"
          pattern="[0-9]{6}"
          placeholder="000000"
          required
        />
      </FormField>
      <ActionFeedback state={state} />
      <SubmitButton>Vérifier mon identité</SubmitButton>
    </form>
  );
}

export function UpdateProfileForm({
  displayName,
}: Readonly<{ displayName: string }>) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="account-form" noValidate>
      <FormField
        error={fieldError(state, "displayName") ?? ""}
        htmlFor="displayName"
        label="Nom affiché"
      >
        <Input
          autoComplete="name"
          defaultValue={displayName}
          id="displayName"
          invalid={Boolean(fieldError(state, "displayName"))}
          name="displayName"
          required
        />
      </FormField>
      <ActionFeedback state={state} />
      <div className="account-form-actions">
        <SubmitButton>Mettre à jour le profil</SubmitButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="account-form" noValidate>
      <FormField
        error={fieldError(state, "currentPassword") ?? ""}
        htmlFor="currentPassword"
        label="Mot de passe actuel"
      >
        <Input
          autoComplete="current-password"
          id="currentPassword"
          invalid={Boolean(fieldError(state, "currentPassword"))}
          name="currentPassword"
          required
          type="password"
        />
      </FormField>
      <div className="account-password-grid">
        <FormField
          error={fieldError(state, "password") ?? ""}
          hint="12 caractères, majuscule, minuscule et chiffre."
          htmlFor="newPassword"
          label="Nouveau mot de passe"
        >
          <Input
            autoComplete="new-password"
            id="newPassword"
            invalid={Boolean(fieldError(state, "password"))}
            name="password"
            required
            type="password"
          />
        </FormField>
        <FormField
          error={fieldError(state, "passwordConfirmation") ?? ""}
          htmlFor="newPasswordConfirmation"
          label="Confirmation"
        >
          <Input
            autoComplete="new-password"
            id="newPasswordConfirmation"
            invalid={Boolean(fieldError(state, "passwordConfirmation"))}
            name="passwordConfirmation"
            required
            type="password"
          />
        </FormField>
      </div>
      <ActionFeedback state={state} />
      <div className="account-form-actions">
        <SubmitButton>Changer le mot de passe</SubmitButton>
      </div>
    </form>
  );
}
