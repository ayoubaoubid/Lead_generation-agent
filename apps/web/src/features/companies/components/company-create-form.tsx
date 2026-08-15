"use client";

import { Building2, Plus } from "lucide-react";
import { useActionState } from "react";

import { Button, Card, FormField, Input, Textarea } from "@/components/ui";
import { createCompanyAction } from "@/features/companies/company.actions";
import { LeadDataActionMessage } from "@/features/lead-data/components/action-message";
import { initialTenantActionState } from "@/types/tenant-action-state";

export function CompanyCreateForm({
  canWrite,
}: Readonly<{ canWrite: boolean }>) {
  const [state, action, pending] = useActionState(
    createCompanyAction,
    initialTenantActionState,
  );
  if (!canWrite) return null;

  return (
    <Card className="lead-data-create-card">
      <div className="lead-data-card-heading">
        <span className="ui-icon-tile">
          <Building2 aria-hidden size={17} />
        </span>
        <div>
          <h2>Ajouter une entreprise</h2>
          <p>Création manuelle avec provenance explicite.</p>
        </div>
      </div>
      <form action={action} className="lead-data-form">
        <div className="lead-data-form-grid">
          <FormField htmlFor="company-name" label="Nom">
            <Input id="company-name" name="name" required />
          </FormField>
          <FormField htmlFor="company-domain" label="Domaine" optional>
            <Input
              autoCapitalize="none"
              id="company-domain"
              name="domain"
              placeholder="example.com"
            />
          </FormField>
          <FormField htmlFor="company-website" label="Site web" optional>
            <Input id="company-website" name="websiteUrl" type="url" />
          </FormField>
          <FormField htmlFor="company-industry" label="Secteur" optional>
            <Input id="company-industry" name="industry" />
          </FormField>
          <FormField htmlFor="company-country" label="Pays" optional>
            <Input id="company-country" maxLength={2} name="countryCode" />
          </FormField>
          <FormField htmlFor="company-employees" label="Effectif" optional>
            <Input
              id="company-employees"
              min={0}
              name="employeeCount"
              type="number"
            />
          </FormField>
          <FormField
            htmlFor="company-technologies"
            label="Technologies"
            optional
          >
            <Input
              id="company-technologies"
              name="technologies"
              placeholder="HubSpot, Next.js"
            />
          </FormField>
          <FormField htmlFor="company-confidence" label="Confiance" optional>
            <Input
              id="company-confidence"
              max={100}
              min={0}
              name="confidenceScore"
              type="number"
            />
          </FormField>
          <FormField htmlFor="company-source" label="Source" optional>
            <Input
              id="company-source"
              name="sourceProvider"
              placeholder="Recherche manuelle"
            />
          </FormField>
          <FormField
            htmlFor="company-external"
            label="Identifiant externe"
            optional
          >
            <Input id="company-external" name="externalId" />
          </FormField>
        </div>
        <input name="annualRevenue" type="hidden" value="" />
        <input name="revenueCurrency" type="hidden" value="" />
        <input name="sourceUrl" type="hidden" value="" />
        <input name="factStatus" type="hidden" value="confirmed" />
        <FormField htmlFor="company-description" label="Description" optional>
          <Textarea id="company-description" name="description" rows={3} />
        </FormField>
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
