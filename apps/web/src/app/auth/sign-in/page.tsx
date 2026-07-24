import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/features/auth/auth-shell";
import { SignInForm } from "@/features/auth/auth-forms";
import { getAuthNotice } from "@/features/auth/auth-messages";
import { getPostAuthRedirectPath } from "@/features/auth/auth-redirect";

export const metadata: Metadata = { title: "Connexion · Lead Operations" };

type SignInPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const notice = getAuthNotice(firstValue(params.notice));
  const nextPath = getPostAuthRedirectPath(firstValue(params.next));

  return (
    <AuthShell
      description="Utilisez l’adresse associée à votre invitation."
      eyebrow="Bienvenue"
      footer={
        <>
          <Link href="/auth/forgot-password">Mot de passe oublié ?</Link>
          <Link href="/auth/register">Comment obtenir un accès</Link>
        </>
      }
      title="Connectez-vous à votre espace"
    >
      {notice ? (
        <p className="auth-notice" role="status">
          {notice}
        </p>
      ) : null}
      <SignInForm nextPath={nextPath} />
    </AuthShell>
  );
}
