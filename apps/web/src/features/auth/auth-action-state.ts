import type { ZodError } from "zod";

export type AuthFieldErrors = Readonly<Record<string, string[] | undefined>>;

export type AuthActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: AuthFieldErrors;
}>;

export const initialAuthActionState: AuthActionState = { status: "idle" };

export function validationErrorState(error: ZodError): AuthActionState {
  return {
    status: "error",
    message: "Vérifiez les informations saisies.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export function authErrorState(message: string): AuthActionState {
  return { message, status: "error" };
}

export function authSuccessState(message: string): AuthActionState {
  return { message, status: "success" };
}
