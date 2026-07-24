import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MfaVerificationForm } from "@/features/auth/auth-forms";
import { AuthShell } from "@/features/auth/auth-shell";
import { requireAuthenticatedUser } from "@/features/auth/auth-session.service";

export const metadata: Metadata = {
  title: "Vérification renforcée · Lead Operations",
};

export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const { supabase } = await requireAuthenticatedUser({ requireMfa: false });
  const [{ data: assurance }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  if (assurance?.currentLevel === "aal2") {
    redirect("/account/profile");
  }

  const verifiedFactor = factors?.totp.find(
    (factor) => factor.status === "verified",
  );

  if (!verifiedFactor) {
    redirect("/account/profile");
  }

  return (
    <AuthShell
      description="Votre compte exige une seconde preuve d’identité pour cette session."
      eyebrow="Authentification multifacteur"
      title="Saisissez votre code temporaire"
    >
      <MfaVerificationForm factorId={verifiedFactor.id} />
    </AuthShell>
  );
}
