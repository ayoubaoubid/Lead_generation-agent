import { ContactRound, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
} from "@/components/ui";
import { ContactArchiveButton } from "@/features/contacts/components/contact-archive-button";
import { ContactCreateForm } from "@/features/contacts/components/contact-create-form";
import { getContactsPageData } from "@/features/lead-data/lead-data.queries";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q : "";
  const result = await getContactsPageData(search);
  if (!result.ok) {
    return (
      <section className="workspace-page lead-data-page">
        <PageHeader title="Contacts" />
        <ErrorState
          description={result.message}
          title="Contacts indisponibles"
        />
      </section>
    );
  }

  return (
    <section className="workspace-page lead-data-page">
      <PageHeader
        actions={
          <Link
            className="ui-button ui-button--secondary ui-button--md"
            href="/imports"
          >
            Importer un CSV
          </Link>
        }
        description="Contacts professionnels dédupliqués, rattachés à leur entreprise et à leurs sources."
        eyebrow="Données vérifiables"
        title="Contacts"
      />
      <ContactCreateForm
        canWrite={result.data.canWrite}
        companies={result.data.companies}
      />
      <Card className="lead-data-list-card">
        <form className="lead-data-search" method="get">
          <Search aria-hidden size={16} />
          <Input
            aria-label="Rechercher un contact"
            defaultValue={search}
            name="q"
            placeholder="Rechercher par nom…"
          />
        </form>
        {result.data.contacts.length ? (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <caption className="sr-only">Contacts du client actif</caption>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Entreprise</th>
                  <th>Qualité</th>
                  <th>Vérification</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.data.contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <strong>{contact.fullName}</strong>
                      <small>
                        {contact.email ?? contact.linkedinUrl ?? "—"}
                      </small>
                    </td>
                    <td>{contact.companyName ?? "Non rattaché"}</td>
                    <td>
                      <Badge
                        tone={
                          contact.factStatus === "confirmed"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {contact.factStatus}
                      </Badge>
                    </td>
                    <td>{contact.verificationStatus}</td>
                    <td>
                      {result.data.canWrite ? (
                        <ContactArchiveButton contactId={contact.id} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description="Ajoutez un contact avec un email ou LinkedIn, ou préparez un import CSV."
            icon={<ContactRound aria-hidden size={20} />}
            title="Aucun contact"
          />
        )}
      </Card>
    </section>
  );
}
