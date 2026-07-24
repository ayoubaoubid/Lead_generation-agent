"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPasswordRecoveryRedirectUrl } from "@/lib/auth/auth-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  authErrorState,
  authSuccessState,
  type AuthActionState,
  validationErrorState,
} from "./auth-action-state";
import { AUTH_MESSAGES } from "./auth-messages";
import { getPostAuthRedirectPath } from "./auth-redirect";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  signInSchema,
  updatePasswordSchema,
  updateProfileSchema,
  verifyMfaSchema,
} from "./auth.schemas";
import { requestPasswordRecovery } from "./password-recovery.service";

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: stringField(formData, "email"),
    password: stringField(formData, "password"),
    next: stringField(formData, "next") || undefined,
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return authErrorState(AUTH_MESSAGES.unavailable);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return authErrorState(AUTH_MESSAGES.invalidCredentials);
  }

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const nextPath =
    assurance?.currentLevel === "aal1" && assurance.nextLevel === "aal2"
      ? "/auth/mfa"
      : getPostAuthRedirectPath(parsed.data.next);

  redirect(nextPath);
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: stringField(formData, "email"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  let supabase;
  let recoveryRedirectUrl: string;
  try {
    supabase = await createServerSupabaseClient();
    recoveryRedirectUrl = buildPasswordRecoveryRedirectUrl();
  } catch {
    return authErrorState(AUTH_MESSAGES.unavailable);
  }

  return requestPasswordRecovery(
    supabase.auth,
    parsed.data.email,
    recoveryRedirectUrl,
  );
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: stringField(formData, "password"),
    passwordConfirmation: stringField(formData, "passwordConfirmation"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return authErrorState(AUTH_MESSAGES.unavailable);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return authErrorState(AUTH_MESSAGES.passwordUpdateFailed);
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return authErrorState(AUTH_MESSAGES.passwordUpdateFailed);
  }

  redirect("/account/profile?notice=password-updated");
}

export async function changePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: stringField(formData, "currentPassword"),
    password: stringField(formData, "password"),
    passwordConfirmation: stringField(formData, "passwordConfirmation"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return authErrorState(AUTH_MESSAGES.unavailable);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return authErrorState(AUTH_MESSAGES.passwordUpdateFailed);
  }

  const { error } = await supabase.auth.updateUser({
    current_password: parsed.data.currentPassword,
    password: parsed.data.password,
  });

  if (error) {
    return authErrorState(AUTH_MESSAGES.passwordUpdateFailed);
  }

  return authSuccessState("Votre mot de passe a été modifié.");
}

export async function updateProfileAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateProfileSchema.safeParse({
    displayName: stringField(formData, "displayName"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return authErrorState(AUTH_MESSAGES.unavailable);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return authErrorState(AUTH_MESSAGES.profileUpdateFailed);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    return authErrorState(AUTH_MESSAGES.profileUpdateFailed);
  }

  revalidatePath("/account/profile");
  return authSuccessState("Votre profil a été mis à jour.");
}

export async function verifyMfaAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = verifyMfaSchema.safeParse({
    code: stringField(formData, "code"),
    factorId: stringField(formData, "factorId"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return authErrorState(AUTH_MESSAGES.unavailable);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find(
    (candidate) =>
      candidate.id === parsed.data.factorId && candidate.status === "verified",
  );

  if (!user || !factor) {
    return authErrorState(AUTH_MESSAGES.mfaVerificationFailed);
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: parsed.data.code,
  });

  if (error) {
    return authErrorState(AUTH_MESSAGES.mfaVerificationFailed);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut({ scope: "local" });
  } finally {
    redirect("/auth/sign-in?notice=signed-out");
  }
}
