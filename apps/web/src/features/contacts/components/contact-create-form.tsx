"use client";

import { Plus, UserRoundPlus } from "lucide-react";
import { useActionState } from "react";

import { Button, Card, FormField, Input } from "@/components/ui";
import type { Company } from "@/domain/companies/company";
import { createContactAction } from "@/features/contacts/contact.actions";
import { LeadDataActionMessage } from "@/features/lead-data/components/action-message";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function ContactCreateForm({
  canWrite,
  companies,
}: Readonly<{ canWrite: boolean; companies: readonly Company[] }>) {
  const [state, action, pending] = useActionState(
    createContactAction,
    initialTenantActionState,
  );
  if (!canWrite) return null;

  return (
    <Card className="lead-data-create-card">
      <div className="lead-data-card-heading">
        <span className="ui-icon-tile">
          <UserRoundPlus aria-hidden size={17} />
        </span>
        <div>
          <h2>Ajouter un contact</h2>
          <p>Email ou profil LinkedIn requis pour la déduplication.</p>
        </div>
      </div>
      <form action={action} className="lead-data-form">
        <div className="lead-data-form-grid">
          <FormField htmlFor="contact-first-name" label="Prénom" optional>
            <Input id="contact-first-name" name="firstName" />
          </FormField>
          <FormField htmlFor="contact-last-name" label="Nom" optional>
            <Input id="contact-last-name" name="lastName" />
          </FormField>
          <FormField htmlFor="contact-full-name" label="Nom complet" optional>
            <Input id="contact-full-name" name="fullName" />
          </FormField>
          <FormField htmlFor="contact-company" label="Entreprise" optional>
            <select
              className="ui-input lead-data-native-select"
              id="contact-company"
              name="companyId"
            >
              <option value="">Non rattaché</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="contact-email" label="Email" optional>
            <Input id="contact-email" name="email" type="email" />
          </FormField>
          <FormField htmlFor="contact-linkedin" label="LinkedIn" optional>
            <Input id="contact-linkedin" name="linkedinUrl" type="url" />
          </FormField>
          <FormField htmlFor="contact-title" label="Poste" optional>
            <Input id="contact-title" name="jobTitle" />
          </FormField>
          <FormField htmlFor="contact-department" label="Département" optional>
            <Input id="contact-department" name="department" />
          </FormField>
          <FormField htmlFor="contact-confidence" label="Confiance" optional>
            <Input
              id="contact-confidence"
              max={100}
              min={0}
              name="confidenceScore"
              type="number"
            />
          </FormField>
          <FormField htmlFor="contact-source" label="Source" optional>
            <Input id="contact-source" name="sourceProvider" />
          </FormField>
        </div>
        {["seniority", "phone", "countryCode", "externalId", "sourceUrl"].map(
          (name) => (
            <input key={name} name={name} type="hidden" value="" />
          ),
        )}
        <input name="factStatus" type="hidden" value="confirmed" />
        <LeadDataActionMessage state={state} />
        <Button
          iconLeading={<Plus aria-hidden size={16} />}
          loading={pending}
          type="submit"
        >
          Ajouter
        </Button>
      </form>
    </Card>
  );
}
