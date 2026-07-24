import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui";

type AuthShellProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}>;

export function AuthShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthShellProps) {
  return (
    <main className="auth-page">
      <section
        className="auth-story"
        aria-label="Présentation de la plateforme"
      >
        <Link className="auth-brand" href="/">
          <span className="auth-brand-mark" aria-hidden>
            L
          </span>
          <span>Lead Operations</span>
        </Link>
        <div className="auth-story-copy">
          <Badge tone="brand">Espace professionnel sécurisé</Badge>
          <h2>Le système d’exploitation commercial de votre agence.</h2>
          <p>
            Une plateforme multiclient où la recherche, la qualification et les
            campagnes restent contrôlées, traçables et isolées.
          </p>
        </div>
        <div className="auth-trust-note">
          <ShieldCheck aria-hidden size={18} />
          <span>
            Sessions sécurisées · Accès sur invitation · Isolation RLS
          </span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
