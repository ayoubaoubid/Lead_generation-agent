"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPasswordRecoveryRedirectUrl } from "@/lib/auth/auth-url";
import { serverLogger } from "@/lib/logging/server-logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  clearActiveClientCookie,
  setActiveAgencyCookie,
} from "@/lib/tenancy/server-tenant-context";
import { acceptPendingRecruiterInvitations } from "@/services/agency/recruiter-invitation.service";

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

async function activatePendingRecruiterContext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
) {
  try {
    const agencyId = await acceptPendingRecruiterInvitations(supabase);

    if (agencyId) {
      await setActiveAgencyCookie(agencyId);
      await clearActiveClientCookie();
    }
  } catch (error) {
    serverLogger.warn("Pending Recruiter invitations could not be activated.", {
      correlationId: crypto.randomUUID(),
      operation: "auth.accept_recruiter_invitations",
      attributes: {
        error: error instanceof Error ? error.message : "unknown",
      },
    });
  }
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

  await activatePendingRecruiterContext(supabase);

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

  await activatePendingRecruiterContext(supabase);
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
