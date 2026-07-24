import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/features/auth/auth-forms";
import { AuthShell } from "@/features/auth/auth-shell";

export const metadata: Metadata = {
  title: "Récupération du compte · Lead Operations",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Saisissez votre adresse professionnelle. Si elle correspond à un compte, vous recevrez un lien temporaire."
      eyebrow="Récupération"
      footer={<Link href="/auth/sign-in">Retour à la connexion</Link>}
      title="Retrouvez l’accès à votre compte"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
