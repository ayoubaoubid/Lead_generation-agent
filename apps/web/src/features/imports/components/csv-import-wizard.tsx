"use client";

import { FileUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, Button, Card, FormField, Input } from "@/components/ui";
import type { DataImportEntityType } from "@/domain/imports/data-import";
import {
  parseCsv,
  type CsvDelimiter,
  type ParsedCsv,
} from "@/lib/csv/csv-parser";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  companyImportFields,
  contactImportFields,
  prepareDataImportSchema,
  type ImportColumnMapping,
  type ImportField,
} from "@/validations/imports/data-import.schema";

const labels: Readonly<Record<ImportField, string>> = {
  name: "Nom de l’entreprise",
  domain: "Domaine",
  websiteUrl: "Site web",
  industry: "Secteur",
  countryCode: "Pays",
  employeeCount: "Effectif",
  annualRevenue: "Chiffre d’affaires",
  revenueCurrency: "Devise",
  technologies: "Technologies",
  description: "Description",
  firstName: "Prénom",
  lastName: "Nom",
  fullName: "Nom complet",
  email: "Email",
  linkedinUrl: "Profil LinkedIn",
  jobTitle: "Poste",
  department: "Département",
  seniority: "Niveau hiérarchique",
  phone: "Téléphone",
  companyDomain: "Domaine de l’entreprise",
  companyName: "Nom de l’entreprise rattachée",
  sourceProvider: "Fournisseur / source",
  externalId: "Identifiant externe",
  sourceUrl: "URL source",
  collectedAt: "Date de collecte",
  confidenceScore: "Niveau de confiance",
  factStatus: "Statut du fait",
};

const aliases: Readonly<Record<string, readonly string[]>> = {
  name: ["company", "company name", "organization", "nom entreprise"],
  domain: ["domain", "website domain", "domaine"],
  websiteUrl: ["website", "website url", "site web"],
  industry: ["industry", "sector", "secteur"],
  countryCode: ["country", "country code", "pays"],
  employeeCount: ["employees", "employee count", "effectif"],
  annualRevenue: ["revenue", "annual revenue", "chiffre affaires"],
  firstName: ["first name", "firstname", "prenom"],
  lastName: ["last name", "lastname", "nom"],
  fullName: ["full name", "contact name", "nom complet"],
  email: ["email", "email address", "e-mail"],
  linkedinUrl: ["linkedin", "linkedin url", "linkedin profile"],
  jobTitle: ["title", "job title", "poste"],
  companyDomain: ["company domain", "organization domain"],
  companyName: ["company", "company name", "organization"],
  sourceProvider: ["source", "provider"],
  externalId: ["external id", "provider id"],
  collectedAt: ["collected at", "collection date"],
  confidenceScore: ["confidence", "confidence score"],
  factStatus: ["fact status", "data status"],
};

function automaticMapping(
  headers: readonly string[],
  fields: readonly ImportField[],
): ImportColumnMapping {
  const used = new Set<string>();
  return Object.fromEntries(
    fields.flatMap((field) => {
      const candidates = [field.toLowerCase(), ...(aliases[field] ?? [])];
      const match = headers.find(
        (header) =>
          !used.has(header) && candidates.includes(header.trim().toLowerCase()),
      );
      if (!match) return [];
      used.add(match);
      return [[field, match]];
    }),
  );
}

async function sha256(file: File) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function CsvImportWizard({ canWrite }: Readonly<{ canWrite: boolean }>) {
  const [entityType, setEntityType] = useState<DataImportEntityType>("company");
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(",");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoverableImportId, setRecoverableImportId] = useState<string | null>(
    null,
  );
  const fields = useMemo(
    () =>
      (entityType === "company"
        ? companyImportFields
        : contactImportFields) as readonly ImportField[],
    [entityType],
  );

  async function readFile(nextFile: File | null, nextDelimiter = delimiter) {
    setFile(nextFile);
    setError(null);
    setMessage(null);
    setRecoverableImportId(null);
    if (!nextFile) {
      setPreview(null);
      setMapping({});
      return;
    }
    if (nextFile.size > 6 * 1024 * 1024) {
      setError("Le fichier dépasse la limite de 6 Mo.");
      setPreview(null);
      return;
    }
    try {
      const parsed = parseCsv(await nextFile.text(), nextDelimiter);
      setPreview(parsed);
      setMapping(automaticMapping(parsed.headers, fields));
    } catch {
      setError("Le CSV est illisible ou contient une citation non fermée.");
      setPreview(null);
    }
  }

  async function submitImport() {
    if (!file || !preview) return;
    setPending(true);
    setError(null);
    setRecoverableImportId(null);
    setMessage("Préparation de l’espace d’import…");
    try {
      const input = prepareDataImportSchema.parse({
        entityType,
        fileName: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_"),
        mimeType: [
          "text/csv",
          "application/csv",
          "application/vnd.ms-excel",
          "text/plain",
        ].includes(file.type)
          ? file.type
          : "text/csv",
        fileSizeBytes: file.size,
        fileSha256: await sha256(file),
        delimiter,
        columnMapping: mapping,
        estimatedRowCount: preview.totalRowCount,
      });
      const prepareResponse = await fetch("/api/imports/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const prepared = (await prepareResponse.json()) as {
        id?: string;
        storagePath?: string;
        message?: string;
      };
      if (!prepareResponse.ok || !prepared.id || !prepared.storagePath) {
        throw new Error(prepared.message ?? "Préparation impossible.");
      }
      setRecoverableImportId(prepared.id);

      setMessage("Téléversement sécurisé du fichier…");
      const upload = await createBrowserSupabaseClient()
        .storage.from("lead-imports")
        .upload(prepared.storagePath, file, {
          cacheControl: "3600",
          contentType: input.mimeType,
          upsert: false,
        });
      if (upload.error) throw new Error("Le téléversement a échoué.");

      setMessage("Planification du traitement asynchrone…");
      const queueResponse = await fetch(`/api/imports/${prepared.id}/queue`, {
        method: "POST",
      });
      const queued = (await queueResponse.json()) as { message?: string };
      if (!queueResponse.ok) {
        throw new Error(queued.message ?? "Planification impossible.");
      }
      window.location.assign(`/imports/${prepared.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "L’import n’a pas pu être préparé.",
      );
      setMessage(null);
      setPending(false);
    }
  }

  if (!canWrite) {
    return (
      <Card className="lead-data-safety-card">
        <ShieldCheck aria-hidden size={18} />
        <p>Votre rôle autorise la consultation, pas la création d’imports.</p>
      </Card>
    );
  }

  return (
    <Card className="import-wizard">
      <div className="lead-data-card-heading">
        <span className="ui-icon-tile">
          <FileUp aria-hidden size={17} />
        </span>
        <div>
          <h2>Nouvel import CSV</h2>
          <p>Prévisualisez et mappez les colonnes avant toute écriture.</p>
        </div>
      </div>

      <div className="import-wizard-controls">
        <FormField htmlFor="import-entity" label="Type de données">
          <select
            className="ui-input lead-data-native-select"
            disabled={pending}
            id="import-entity"
            onChange={(event) => {
              const next = event.target.value as DataImportEntityType;
              setEntityType(next);
              const nextFields = (
                next === "company" ? companyImportFields : contactImportFields
              ) as readonly ImportField[];
              if (preview) {
                setMapping(automaticMapping(preview.headers, nextFields));
              }
            }}
            value={entityType}
          >
            <option value="company">Entreprises</option>
            <option value="contact">Contacts</option>
          </select>
        </FormField>
        <FormField htmlFor="import-delimiter" label="Séparateur">
          <select
            className="ui-input lead-data-native-select"
            disabled={pending}
            id="import-delimiter"
            onChange={async (event) => {
              const next = event.target.value as CsvDelimiter;
              setDelimiter(next);
              await readFile(file, next);
            }}
            value={delimiter}
          >
            <option value=",">Virgule</option>
            <option value=";">Point-virgule</option>
            <option value={"\t"}>Tabulation</option>
            <option value="|">Barre verticale</option>
          </select>
        </FormField>
        <FormField
          hint="CSV privé, 6 Mo maximum. Les fichiers volumineux sont traités par lots."
          htmlFor="import-file"
          label="Fichier"
        >
          <Input
            accept=".csv,text/csv"
            disabled={pending}
            id="import-file"
            onChange={(event) => readFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </FormField>
      </div>

      {preview ? (
        <>
          <div className="import-summary">
            <Badge tone="brand">{preview.totalRowCount} ligne(s)</Badge>
            <Badge tone={preview.issues.length ? "warning" : "success"}>
              {preview.issues.length
                ? `${preview.issues.length} avertissement(s)`
                : "Structure valide"}
            </Badge>
          </div>
          <div className="import-mapping-grid">
            {fields.map((field) => (
              <FormField key={field} label={labels[field]}>
                <select
                  aria-label={`Colonne CSV pour ${labels[field]}`}
                  className="ui-input lead-data-native-select"
                  disabled={pending}
                  onChange={(event) =>
                    setMapping((current) => {
                      const next = { ...current };
                      if (event.target.value) next[field] = event.target.value;
                      else delete next[field];
                      return next;
                    })
                  }
                  value={mapping[field] ?? ""}
                >
                  <option value="">Ne pas importer</option>
                  {preview.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </FormField>
            ))}
          </div>
          <div className="import-preview-wrap">
            <h3>Prévisualisation</h3>
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    {preview.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {preview.headers.map((header) => (
                        <td key={header}>{row[header] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {message ? (
        <p className="lead-data-message" role="status">
          <LoaderCircle aria-hidden className="ui-spin" size={15} />
          {message}
        </p>
      ) : null}
      {error ? (
        <div
          className="lead-data-message lead-data-message--error"
          role="alert"
        >
          <span>{error}</span>
          {recoverableImportId ? (
            <a href={`/imports/${recoverableImportId}`}>
              Ouvrir l’import préparé
            </a>
          ) : null}
        </div>
      ) : null}
      <Button
        disabled={!file || !preview || preview.totalRowCount === 0}
        iconLeading={<FileUp aria-hidden size={16} />}
        loading={pending}
        onClick={submitImport}
        type="button"
      >
        Importer et traiter
      </Button>
      <p className="import-dedup-note">
        Déduplication sûre : identifiant externe, domaine, email, LinkedIn, puis
        nom normalisé lorsqu’il n’existe qu’un seul candidat. Les doublons sont
        ignorés, jamais fusionnés automatiquement.
      </p>
    </Card>
  );
}
