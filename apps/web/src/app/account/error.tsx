"use client";

import { ErrorState } from "@/components/ui";

export default function AccountError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <main className="account-main">
      <ErrorState
        description="La page n’a pas pu être chargée. Aucun détail sensible n’a été exposé."
        onRetry={reset}
        title="Impossible de charger votre compte"
      />
    </main>
  );
}
