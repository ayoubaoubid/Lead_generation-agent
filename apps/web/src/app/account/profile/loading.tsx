import { LoadingState } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <main className="account-main">
      <LoadingState
        description="Nous vérifions votre session et chargeons votre profil."
        title="Chargement du profil"
      />
    </main>
  );
}
