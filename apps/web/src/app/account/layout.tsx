import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui";
import { signOutAction } from "@/features/auth/auth.actions";
import { requireAuthenticatedUser } from "@/features/auth/auth-session.service";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAuthenticatedUser();

  return (
    <div className="account-shell">
      <header className="account-topbar">
        <Link className="account-brand" href="/account/profile">
          <span className="account-brand-mark" aria-hidden>
            L
          </span>
          <span>Lead Operations</span>
        </Link>
        <div className="account-session">
          <span>
            <ShieldCheck aria-hidden size={15} /> Session sécurisée
          </span>
          <form action={signOutAction}>
            <Button
              iconLeading={<LogOut aria-hidden size={15} />}
              size="sm"
              type="submit"
              variant="secondary"
            >
              Se déconnecter
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
