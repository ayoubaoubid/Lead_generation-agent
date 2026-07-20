import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Generation Sales",
  description:
    "Fondation technique de la plateforme de prospection multitenant.",
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
