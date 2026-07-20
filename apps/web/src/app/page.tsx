const foundations = [
  "Next.js App Router et React",
  "TypeScript strict",
  "ESLint, Prettier et Tailwind CSS",
  "Validation des variables d’environnement",
  "Tests unitaires avec Vitest",
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
          Fondation technique
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Le socle du projet est prêt à accueillir les modules métier.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Cette page confirme uniquement l’initialisation de l’application.
          Aucun parcours métier ni aucune donnée de démonstration ne sont
          inclus.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {foundations.map((foundation) => (
            <li
              className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm"
              key={foundation}
            >
              {foundation}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
