import type { Metadata } from "next";

import "./globals.css";
import "./auth.css";
import "./workspace.css";
import "./clients.css";
import "./onboarding.css";
import "./strategy-artifacts.css";
import "./targeting.css";

export const metadata: Metadata = {
  title: {
    default: "Lead Operations",
    template: "%s · Lead Operations",
  },
  description:
    "Plateforme multitenant de pilotage des opérations de prospection.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
