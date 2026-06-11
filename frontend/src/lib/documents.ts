/**
 * Client-side mirror of the backend document model. Specs are fetched from the
 * API (the backend is the single source of truth); drafts are built up by the
 * chat and rendered by the generic preview / PDF / Markdown builders.
 */

export type FieldType =
  | "text"
  | "multiline"
  | "date"
  | "number"
  | "currency"
  | "percent"
  | "choice";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string | null;
  options?: string[] | null;
  default?: string | null;
};

export type TableSpec = {
  key: string;
  label: string;
  required?: boolean;
  columns: FieldSpec[];
};

export type PartyRole = { role: string; label: string };
export type Section = { title: string; fields: FieldSpec[] };

export type DocumentSpec = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  parties: PartyRole[];
  sections: Section[];
  tables: TableSpec[];
};

export type PartyInfo = {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
};

export type DocumentDraft = {
  typeId: string | null;
  values: Record<string, string>;
  parties: Record<string, PartyInfo>;
  tables: Record<string, Record<string, string>[]>;
};

/** The party sub-fields shown in the cover-page party block. */
export const PARTY_FIELDS: { key: keyof PartyInfo; label: string }[] = [
  { key: "name", label: "Print Name" },
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "noticeAddress", label: "Notice Address" },
];

export const emptyDraft = (): DocumentDraft => ({
  typeId: null,
  values: {},
  parties: {},
  tables: {},
});

/** A non-empty value, or a bracketed placeholder for the preview. */
export const valueOr = (value: string | undefined, placeholder: string): string =>
  value && value.trim() ? value : `[${placeholder}]`;

/** Build a download filename from the parties' companies. */
export const documentFilename = (
  spec: DocumentSpec,
  draft: DocumentDraft,
  extension: string,
): string => {
  const slug = (s: string) =>
    s.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const companies = spec.parties
    .map((p) => slug(draft.parties[p.role]?.company ?? ""))
    .filter(Boolean)
    .join("-and-");
  const base = slug(spec.name) + (companies ? `-${companies}` : "");
  return `${base}.${extension}`;
};
