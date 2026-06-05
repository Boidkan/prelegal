/**
 * Data model for the Mutual NDA Cover Page — the user-completed half of the
 * agreement. The static legal text lives in `standardTerms.ts`.
 */

/** Details for one of the two parties to the agreement. */
export type Party = {
  name: string;
  title: string;
  company: string;
  /** Email or postal address used for notices. */
  noticeAddress: string;
};

/** Whether the MNDA expires after a fixed term or runs until terminated. */
export type MndaTermKind = "expires" | "untilTerminated";

/** Whether confidentiality obligations last a fixed term or in perpetuity. */
export type ConfidentialityKind = "years" | "perpetuity";

export type NdaForm = {
  purpose: string;
  /** ISO date string (yyyy-mm-dd) from the date input. */
  effectiveDate: string;

  mndaTermKind: MndaTermKind;
  /** Years until the MNDA expires; used when mndaTermKind === "expires". */
  mndaTermYears: number;

  confidentialityKind: ConfidentialityKind;
  /** Years of confidentiality; used when confidentialityKind === "years". */
  confidentialityYears: number;

  /** Governing law state, e.g. "Delaware". */
  governingLaw: string;
  /** Jurisdiction, e.g. "New Castle, DE". */
  jurisdiction: string;

  /** Optional free-text modifications to the Standard Terms. */
  modifications: string;

  party1: Party;
  party2: Party;
};

const emptyParty = (): Party => ({
  name: "",
  title: "",
  company: "",
  noticeAddress: "",
});

/** Sensible starting values matching the Common Paper template defaults. */
export const defaultNdaForm = (): NdaForm => ({
  purpose:
    "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: "",
  mndaTermKind: "expires",
  mndaTermYears: 1,
  confidentialityKind: "years",
  confidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: emptyParty(),
  party2: emptyParty(),
});

/** Pluralize a year count, e.g. 1 → "1 year", 2 → "2 years". */
export const formatYears = (n: number): string =>
  `${n} ${n === 1 ? "year" : "years"}`;

/** Human-readable effective date, falling back to a placeholder when unset. */
export const formatEffectiveDate = (iso: string): string => {
  if (!iso) return "[Effective Date]";
  // Parse as a local date to avoid timezone shifting the displayed day.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** Sentence describing how long the MNDA itself lasts. */
export const mndaTermText = (form: NdaForm): string =>
  form.mndaTermKind === "expires"
    ? `Expires ${formatYears(form.mndaTermYears)} from the Effective Date.`
    : "Continues until terminated in accordance with the terms of the MNDA.";

/** Sentence describing how long confidentiality obligations last. */
export const confidentialityText = (form: NdaForm): string =>
  form.confidentialityKind === "years"
    ? `${formatYears(
        form.confidentialityYears,
      )} from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`
    : "In perpetuity.";

/** Field value with a bracketed placeholder fallback for empty inputs. */
export const orPlaceholder = (value: string, placeholder: string): string =>
  value.trim() ? value.trim() : `[${placeholder}]`;

/** Modifications text, defaulting to "None." when the field is empty. */
export const modificationsText = (form: NdaForm): string =>
  form.modifications.trim() || "None.";
