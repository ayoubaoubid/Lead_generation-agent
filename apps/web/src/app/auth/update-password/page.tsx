import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/features/auth/auth-forms";
import { AuthShell } from "@/features/auth/auth-shell";
import { requireAuthenticatedUser } from "@/features/auth/auth-session.service";

export const metadata: Metadata = {
  title: "Définir le mot de passe · Lead Operations",
};

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  await requireAuthenticatedUser({ requireMfa: false });

  return (
    <AuthShell
      description="Choisissez un mot de passe unique. Celui-ci n’est jamais envoyé à l’application ni conservé dans ses journaux."
      eyebrow="Sécurisation du compte"
      title="Définissez votre nouveau mot de passe"
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
