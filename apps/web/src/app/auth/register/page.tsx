import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui";
import { AuthShell } from "@/features/auth/auth-shell";

export const metadata: Metadata = {
  title: "Accès sur invitation · Lead Operations",
};

export default function RegisterPage() {
  return (
    <AuthShell
      description="La plateforme n’accepte pas les inscriptions publiques. Chaque compte est rattaché à une agence ou un client par un administrateur autorisé."
      eyebrow="Inscription contrôlée"
      footer={<Link href="/auth/sign-in">J’ai déjà reçu mon accès</Link>}
      title="Votre espace est créé sur invitation"
    >
      <div className="auth-invite-flow">
        <div>
          <Badge tone="brand">01</Badge>
          <p>Votre administrateur confirme votre rôle et votre périmètre.</p>
        </div>
        <div>
          <Badge tone="brand">02</Badge>
          <p>
            Vous recevez un lien temporaire à votre adresse professionnelle.
          </p>
        </div>
        <div>
          <Badge tone="brand">03</Badge>
          <p>Vous définissez votre mot de passe puis accédez à votre profil.</p>
        </div>
      </div>
      <p className="auth-help">
        Vous n’avez pas reçu d’invitation ? Contactez l’administrateur de votre
        agence. Pour votre sécurité, nous ne confirmons pas publiquement
        l’existence d’un compte.
      </p>
    </AuthShell>
  );
}
