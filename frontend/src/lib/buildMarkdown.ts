/**
 * Assemble a complete Mutual NDA (Cover Page + Standard Terms) as Markdown,
 * mirroring the layout of `templates/Mutual-NDA-coverpage.md`.
 */

import {
  STANDARD_TERMS,
  STANDARD_TERMS_ATTRIBUTION,
  STANDARD_TERMS_HEADING,
} from "./standardTerms";
import {
  confidentialityText,
  formatEffectiveDate,
  mndaTermText,
  modificationsText,
  orPlaceholder,
  type NdaForm,
  type Party,
} from "./nda";

const partyRow = (label: string, p1: string, p2: string): string =>
  `| ${label} | ${p1 || ""} | ${p2 || ""} |`;

const partyTable = (a: Party, b: Party): string => {
  const rows = [
    "|| PARTY 1 | PARTY 2 |",
    "| :--- | :--- | :--- |",
    partyRow("Print Name", a.name, b.name),
    partyRow("Title", a.title, b.title),
    partyRow("Company", a.company, b.company),
    partyRow("Notice Address", a.noticeAddress, b.noticeAddress),
    partyRow("Signature", "", ""),
    partyRow("Date", "", ""),
  ];
  return rows.join("\n");
};

export const buildMarkdown = (form: NdaForm): string => {
  const lines: string[] = [];

  lines.push("# Mutual Non-Disclosure Agreement");
  lines.push("");
  lines.push(
    "This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0. Any modifications of the Standard Terms are made on the Cover Page, which will control over conflicts with the Standard Terms.",
  );
  lines.push("");

  lines.push("## Cover Page");
  lines.push("");

  lines.push("### Purpose");
  lines.push(orPlaceholder(form.purpose, "How Confidential Information may be used"));
  lines.push("");

  lines.push("### Effective Date");
  lines.push(formatEffectiveDate(form.effectiveDate));
  lines.push("");

  lines.push("### MNDA Term");
  lines.push(mndaTermText(form));
  lines.push("");

  lines.push("### Term of Confidentiality");
  lines.push(confidentialityText(form));
  lines.push("");

  lines.push("### Governing Law & Jurisdiction");
  lines.push(`Governing Law: ${orPlaceholder(form.governingLaw, "state")}`);
  lines.push("");
  lines.push(
    `Jurisdiction: ${orPlaceholder(form.jurisdiction, "city or county and state")}`,
  );
  lines.push("");

  lines.push("### MNDA Modifications");
  lines.push(modificationsText(form));
  lines.push("");

  lines.push(
    "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.",
  );
  lines.push("");
  lines.push(partyTable(form.party1, form.party2));
  lines.push("");

  lines.push(`## ${STANDARD_TERMS_HEADING}`);
  lines.push("");
  STANDARD_TERMS.forEach((clause, i) => {
    lines.push(`${i + 1}. **${clause.title}.** ${clause.body}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push(STANDARD_TERMS_ATTRIBUTION);
  lines.push("");

  return lines.join("\n");
};

/** Build a filename like "Mutual-NDA-Acme-Inc.md" from the party companies. */
export const ndaFilename = (form: NdaForm, extension: string): string => {
  const slug = (s: string) =>
    s
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const parties = [form.party1.company, form.party2.company]
    .map(slug)
    .filter(Boolean)
    .join("-and-");
  const base = parties ? `Mutual-NDA-${parties}` : "Mutual-NDA";
  return `${base}.${extension}`;
};
