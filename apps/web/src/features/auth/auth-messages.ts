export const AUTH_MESSAGES = {
  invalidCredentials:
    "Connexion impossible. Vérifiez vos informations ou réinitialisez votre mot de passe.",
  unavailable:
    "Le service d’authentification est momentanément indisponible. Réessayez plus tard.",
  resetRequested:
    "Si un compte correspond à cette adresse, un email de récupération sera envoyé.",
  passwordUpdateFailed:
    "Le mot de passe n’a pas pu être mis à jour. Demandez un nouveau lien si nécessaire.",
  profileUpdateFailed:
    "Le profil n’a pas pu être mis à jour. Réessayez dans quelques instants.",
  mfaVerificationFailed:
    "Le code n’a pas pu être vérifié. Vérifiez-le puis réessayez.",
} as const;

export const AUTH_NOTICES: Readonly<Record<string, string>> = {
  "configuration-unavailable":
    "Supabase n’est pas encore configuré pour cet environnement.",
  "link-invalid": "Ce lien est invalide ou a expiré. Demandez un nouveau lien.",
  "password-updated": "Votre mot de passe a été mis à jour.",
  "signed-out": "Vous avez été déconnecté en toute sécurité.",
};

export function getAuthNotice(notice: string | undefined): string | null {
  return notice ? (AUTH_NOTICES[notice] ?? null) : null;
}
