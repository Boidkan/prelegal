/**
 * Assemble a complete document (filled cover page + Standard Terms) as Markdown
 * from a spec and the in-progress draft. Mirrors the on-screen preview.
 */

import {
  PARTY_FIELDS,
  valueOr,
  type DocumentDraft,
  type DocumentSpec,
  type FieldSpec,
} from "@/lib/documents";

/** Resolve a field's display value: entered value, else default, else blank. */
export const fieldValue = (
  draft: DocumentDraft,
  field: FieldSpec,
): string => draft.values[field.key]?.trim() || field.default || "";

const partyTable = (spec: DocumentSpec, draft: DocumentDraft): string => {
  const header = `| | ${spec.parties.map((p) => p.label).join(" | ")} |`;
  const divider = `| --- | ${spec.parties.map(() => ":---").join(" | ")} |`;
  const rows = PARTY_FIELDS.map(({ key, label }) => {
    const cells = spec.parties.map((p) => draft.parties[p.role]?.[key] ?? "");
    return `| ${label} | ${cells.join(" | ")} |`;
  });
  return [header, divider, ...rows].join("\n");
};

export const buildDocumentMarkdown = (
  spec: DocumentSpec,
  draft: DocumentDraft,
  standardTerms: string,
): string => {
  const lines: string[] = [`# ${spec.name}`, "", "## Cover Page", ""];

  for (const section of spec.sections) {
    lines.push(`### ${section.title}`, "");
    for (const field of section.fields) {
      lines.push(`**${field.label}:** ${valueOr(fieldValue(draft, field), field.label)}`);
      lines.push("");
    }
  }

  for (const table of spec.tables) {
    const rows = draft.tables[table.key] ?? [];
    lines.push(`### ${table.label}`, "");
    lines.push(`| ${table.columns.map((c) => c.label).join(" | ")} |`);
    lines.push(`| ${table.columns.map(() => ":---").join(" | ")} |`);
    if (rows.length === 0) {
      lines.push(`| ${table.columns.map(() => "").join(" | ")} |`);
    } else {
      for (const row of rows) {
        lines.push(`| ${table.columns.map((c) => row[c.key] ?? "").join(" | ")} |`);
      }
    }
    lines.push("");
  }

  lines.push("### Parties", "", partyTable(spec, draft), "");
  lines.push("---", "");
  lines.push(standardTerms.trim());
  lines.push("");
  return lines.join("\n");
};
