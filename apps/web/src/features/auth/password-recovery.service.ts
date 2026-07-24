import { authSuccessState, type AuthActionState } from "./auth-action-state";
import { AUTH_MESSAGES } from "./auth-messages";

type PasswordRecoveryClient = Readonly<{
  resetPasswordForEmail: (
    email: string,
    options: { redirectTo: string },
  ) => Promise<unknown>;
}>;

export async function requestPasswordRecovery(
  client: PasswordRecoveryClient,
  email: string,
  redirectTo: string,
): Promise<AuthActionState> {
  try {
    await client.resetPasswordForEmail(email, { redirectTo });
  } catch {
    // Deliberately identical response: never reveal account existence or provider details.
  }

  return authSuccessState(AUTH_MESSAGES.resetRequested);
}
