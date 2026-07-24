import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";

import { Avatar, Badge, Card, PageHeader } from "@/components/ui";
import {
  ChangePasswordForm,
  UpdateProfileForm,
} from "@/features/auth/auth-forms";
import { getAuthNotice } from "@/features/auth/auth-messages";
import { requireAuthenticatedUser } from "@/features/auth/auth-session.service";

export const metadata: Metadata = { title: "Mon profil · Lead Operations" };

type ProfilePageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { supabase, user } = await requireAuthenticatedUser();
  const [{ data: profile }, { data: assurance }, { data: factors }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_url, locale, timezone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);

  const params = await searchParams;
  const rawNotice = Array.isArray(params.notice)
    ? params.notice[0]
    : params.notice;
  const notice = getAuthNotice(rawNotice);
  const email = user.email ?? "Adresse indisponible";
  const displayName = profile?.display_name ?? email.split("@")[0] ?? "Compte";
  const hasVerifiedFactor = Boolean(
    factors?.totp.some((factor) => factor.status === "verified"),
  );

  return (
    <main className="account-main">
      <PageHeader
        description="Gérez votre identité, votre accès et les paramètres de sécurité liés à votre compte."
        eyebrow="Paramètres du compte"
        title="Mon profil"
      />

      {notice ? (
        <p className="account-notice" role="status">
          {notice}
        </p>
      ) : null}

      <section
        className="account-profile-summary"
        aria-label="Résumé du compte"
      >
        <Avatar
          name={displayName}
          size="lg"
          {...(profile?.avatar_url ? { src: profile.avatar_url } : {})}
        />
        <div>
          <h2>{displayName}</h2>
          <p>{email}</p>
        </div>
        <Badge tone="success">Compte actif</Badge>
      </section>

      <div className="account-grid">
        <Card className="account-card">
          <div className="account-card-heading">
            <span className="account-card-icon">
              <UserRound aria-hidden size={18} />
            </span>
            <div>
              <h2>Identité</h2>
              <p>Les informations visibles par les membres autorisés.</p>
            </div>
          </div>
          <UpdateProfileForm displayName={displayName} />
          <div className="account-readonly-field">
            <Mail aria-hidden size={16} />
            <div>
              <span>Adresse de connexion</span>
              <strong>{email}</strong>
            </div>
          </div>
        </Card>

        <Card className="account-card">
          <div className="account-card-heading">
            <span className="account-card-icon">
              <KeyRound aria-hidden size={18} />
            </span>
            <div>
              <h2>Mot de passe</h2>
              <p>Une confirmation du mot de passe actuel est exigée.</p>
            </div>
          </div>
          <ChangePasswordForm />
        </Card>

        <Card className="account-card account-card--security">
          <div className="account-card-heading">
            <span className="account-card-icon">
              <ShieldCheck aria-hidden size={18} />
            </span>
            <div>
              <h2>Authentification multifacteur</h2>
              <p>
                Le parcours de challenge TOTP est prêt. L’enrôlement sera ouvert
                lorsque la politique MFA sera validée.
              </p>
            </div>
          </div>
          <div className="account-security-status">
            <div>
              <span>Facteur vérifié</span>
              <strong>
                {hasVerifiedFactor ? "Configuré" : "Non configuré"}
              </strong>
            </div>
            <div>
              <span>Niveau de la session</span>
              <strong>
                {assurance?.currentLevel?.toUpperCase() ?? "AAL1"}
              </strong>
            </div>
            <Badge tone={hasVerifiedFactor ? "success" : "neutral"}>
              {hasVerifiedFactor ? "Protection renforcée" : "Activation future"}
            </Badge>
          </div>
        </Card>
      </div>
    </main>
  );
}
