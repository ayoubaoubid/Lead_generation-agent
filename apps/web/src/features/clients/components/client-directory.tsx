import {
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Search,
} from "lucide-react";
import Link from "next/link";

import { Avatar, EmptyState, Input } from "@/components/ui";
import type { ClientPage } from "@/repositories/contracts/client.repository";
import type { ClientListQueryInput } from "@/validations/clients/client.schema";

import { ClientStatusBadge } from "./client-status-badge";

function clientPageUrl(query: ClientListQueryInput, page: number): string {
  const parameters = new URLSearchParams();
  if (query.q) parameters.set("q", query.q);
  if (query.status !== "current") parameters.set("status", query.status);
  if (query.industry) parameters.set("industry", query.industry);
  if (query.country) parameters.set("country", query.country);
  if (page > 1) parameters.set("page", String(page));
  const search = parameters.toString();
  return search ? `/clients?${search}` : "/clients";
}

export function ClientFilters({ query }: { query: ClientListQueryInput }) {
  return (
    <form className="client-filters" method="get">
      <label className="client-search">
        <Search aria-hidden size={16} />
        <span className="sr-only">Rechercher un client</span>
        <Input
          defaultValue={query.q}
          name="q"
          placeholder="Rechercher par nom ou identifiant…"
          type="search"
        />
      </label>
      <select
        aria-label="Filtrer par statut"
        className="ui-input client-native-select"
        defaultValue={query.status}
        name="status"
      >
        <option value="current">Clients actuels</option>
        <option value="draft">Brouillons</option>
        <option value="onboarding">Onboarding</option>
        <option value="active">Actifs</option>
        <option value="paused">En pause</option>
        <option value="archived">Archivés</option>
      </select>
      <Input
        aria-label="Filtrer par secteur"
        defaultValue={query.industry}
        name="industry"
        placeholder="Secteur"
      />
      <Input
        aria-label="Filtrer par pays"
        defaultValue={query.country}
        maxLength={2}
        name="country"
        placeholder="Pays (FR)"
      />
      <button
        className="ui-button ui-button--secondary ui-button--md"
        type="submit"
      >
        Appliquer
      </button>
      {query.q ||
      query.status !== "current" ||
      query.industry ||
      query.country ? (
        <Link className="client-filter-reset" href="/clients">
          Réinitialiser
        </Link>
      ) : null}
    </form>
  );
}

export function ClientDirectory({
  page,
  query,
}: Readonly<{ page: ClientPage; query: ClientListQueryInput }>) {
  const hasFilters = Boolean(
    query.q || query.status !== "current" || query.industry || query.country,
  );

  if (page.items.length === 0) {
    return (
      <div className="client-empty">
        <EmptyState
          action={
            hasFilters ? (
              <Link
                className="ui-button ui-button--secondary ui-button--md"
                href="/clients"
              >
                Effacer les filtres
              </Link>
            ) : (
              <Link
                className="ui-button ui-button--primary ui-button--md"
                href="/clients/new"
              >
                Créer le premier client
              </Link>
            )
          }
          description={
            hasFilters
              ? "Aucun client accessible ne correspond à cette recherche."
              : "Créez un espace client pour centraliser sa stratégie, son équipe et ses campagnes."
          }
          icon={<Building2 aria-hidden size={20} />}
          title={hasFilters ? "Aucun résultat" : "Aucun client"}
        />
      </div>
    );
  }

  return (
    <>
      <div className="client-directory-meta">
        <p>
          <strong>{page.total}</strong>{" "}
          {page.total > 1 ? "clients accessibles" : "client accessible"}
        </p>
        <span>
          Page {page.page} sur {page.totalPages}
        </span>
      </div>
      <div className="client-grid">
        {page.items.map((client) => (
          <Link
            className="client-card"
            href={`/clients/${client.id}`}
            key={client.id}
          >
            <div className="client-card-top">
              <Avatar
                name={client.name}
                size="lg"
                {...(client.logoUrl ? { src: client.logoUrl } : {})}
              />
              <ClientStatusBadge status={client.status} />
            </div>
            <div className="client-card-title">
              <div>
                <h2>{client.name}</h2>
                <p>{client.industry ?? "Secteur non renseigné"}</p>
              </div>
              <ArrowUpRight aria-hidden size={17} />
            </div>
            <dl className="client-card-meta">
              <div>
                <Globe2 aria-hidden size={14} />
                <dt className="sr-only">Site web</dt>
                <dd>
                  {client.websiteUrl
                    ? new URL(client.websiteUrl).hostname.replace(/^www\./u, "")
                    : "Site non renseigné"}
                </dd>
              </div>
              <div>
                <Building2 aria-hidden size={14} />
                <dt className="sr-only">Pays et langue</dt>
                <dd>
                  {[client.countryCode, client.languageCode]
                    .filter(Boolean)
                    .join(" · ") || "Marché non renseigné"}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
      {page.totalPages > 1 ? (
        <nav aria-label="Pagination des clients" className="client-pagination">
          <Link
            aria-disabled={page.page === 1}
            className="ui-button ui-button--secondary ui-button--sm"
            href={clientPageUrl(query, Math.max(1, page.page - 1))}
            tabIndex={page.page === 1 ? -1 : undefined}
          >
            <ChevronLeft aria-hidden size={15} />
            Précédent
          </Link>
          <span>
            {page.page} / {page.totalPages}
          </span>
          <Link
            aria-disabled={page.page === page.totalPages}
            className="ui-button ui-button--secondary ui-button--sm"
            href={clientPageUrl(
              query,
              Math.min(page.totalPages, page.page + 1),
            )}
            tabIndex={page.page === page.totalPages ? -1 : undefined}
          >
            Suivant
            <ChevronRight aria-hidden size={15} />
          </Link>
        </nav>
      ) : null}
    </>
  );
}
