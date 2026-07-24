import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email("Saisissez une adresse email valide.")
      .max(254, "L’adresse email est trop longue."),
  );

const strongPassword = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
  .max(72, "Le mot de passe ne peut pas dépasser 72 caractères.")
  .regex(/[a-z]/u, "Ajoutez au moins une lettre minuscule.")
  .regex(/[A-Z]/u, "Ajoutez au moins une lettre majuscule.")
  .regex(/[0-9]/u, "Ajoutez au moins un chiffre.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe.").max(72),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

const passwordChangeFields = {
  password: strongPassword,
  passwordConfirmation: z.string(),
};

function passwordsMatch(input: {
  password: string;
  passwordConfirmation: string;
}) {
  return input.password === input.passwordConfirmation;
}

export const updatePasswordSchema = z
  .object(passwordChangeFields)
  .refine(passwordsMatch, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["passwordConfirmation"],
  });

export const changePasswordSchema = z
  .object({
    ...passwordChangeFields,
    currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel."),
  })
  .refine(passwordsMatch, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["passwordConfirmation"],
  });

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Saisissez un nom affiché.")
    .max(120, "Le nom affiché ne peut pas dépasser 120 caractères."),
});

export const verifyMfaSchema = z.object({
  factorId: z.uuid(),
  code: z.string().regex(/^\d{6}$/u, "Saisissez le code à 6 chiffres."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;
