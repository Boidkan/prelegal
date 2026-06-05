"use client";

/**
 * Renders a completed Mutual NDA as a print-ready PDF using
 * @react-pdf/renderer. Produces real, selectable text (not a screenshot).
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  confidentialityText,
  formatEffectiveDate,
  mndaTermText,
  modificationsText,
  orPlaceholder,
  type NdaForm,
  type Party,
} from "@/lib/nda";
import {
  COVER_PAGE_INTRO,
  STANDARD_TERMS,
  STANDARD_TERMS_ATTRIBUTION,
  STANDARD_TERMS_HEADING,
} from "@/lib/standardTerms";

const BRAND = "#1d4ed8";
const INK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#d1d5db";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 54,
    fontSize: 10,
    lineHeight: 1.5,
    color: INK,
    fontFamily: "Helvetica",
  },
  brand: {
    fontSize: 9,
    letterSpacing: 2,
    color: BRAND,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  intro: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginTop: 14,
    marginBottom: 4,
  },
  fieldValue: {
    marginBottom: 2,
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cellLabel: {
    width: "28%",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f9fafb",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cell: {
    width: "36%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cellLast: {
    width: "36%",
    padding: 6,
  },
  cellHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: MUTED,
  },
  termsHeading: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  clause: {
    marginBottom: 8,
    textAlign: "justify",
  },
  clauseTitle: {
    fontFamily: "Helvetica-Bold",
  },
  attribution: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    fontSize: 8,
    color: MUTED,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 54,
    right: 54,
    fontSize: 8,
    color: MUTED,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const Field = ({ label, value }: { label: string; value: string }) => (
  <View>
    <Text style={styles.sectionLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const SignatureRow = ({
  label,
  a,
  b,
  last,
}: {
  label: string;
  a: string;
  b: string;
  last?: boolean;
}) => (
  <View style={last ? [styles.row, styles.lastRow] : styles.row}>
    <Text style={styles.cellLabel}>{label}</Text>
    <Text style={styles.cell}>{a}</Text>
    <Text style={styles.cellLast}>{b}</Text>
  </View>
);

const PartyTable = ({ a, b }: { a: Party; b: Party }) => (
  <View style={styles.table}>
    <View style={styles.row}>
      <Text style={styles.cellLabel}> </Text>
      <Text style={[styles.cell, styles.cellHeader]}>PARTY 1</Text>
      <Text style={[styles.cellLast, styles.cellHeader]}>PARTY 2</Text>
    </View>
    <SignatureRow label="Print Name" a={a.name} b={b.name} />
    <SignatureRow label="Title" a={a.title} b={b.title} />
    <SignatureRow label="Company" a={a.company} b={b.company} />
    <SignatureRow label="Notice Address" a={a.noticeAddress} b={b.noticeAddress} />
    <SignatureRow label="Signature" a="" b="" />
    <SignatureRow label="Date" a="" b="" last />
  </View>
);

export function NdaDocument({ form }: { form: NdaForm }) {
  return (
    <Document title="Mutual Non-Disclosure Agreement" author="Prelegal">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Prelegal</Text>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.intro}>{COVER_PAGE_INTRO}</Text>

        <Field
          label="Purpose"
          value={orPlaceholder(
            form.purpose,
            "How Confidential Information may be used",
          )}
        />
        <Field
          label="Effective Date"
          value={formatEffectiveDate(form.effectiveDate)}
        />
        <Field label="MNDA Term" value={mndaTermText(form)} />
        <Field
          label="Term of Confidentiality"
          value={confidentialityText(form)}
        />
        <Field
          label="Governing Law"
          value={orPlaceholder(form.governingLaw, "state")}
        />
        <Field
          label="Jurisdiction"
          value={orPlaceholder(form.jurisdiction, "city or county and state")}
        />
        <Field label="MNDA Modifications" value={modificationsText(form)} />

        <Text style={styles.sectionLabel}>Signatures</Text>
        <Text style={styles.fieldValue}>
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </Text>
        <PartyTable a={form.party1} b={form.party2} />

        <View break>
          <Text style={styles.termsHeading}>{STANDARD_TERMS_HEADING}</Text>
          {STANDARD_TERMS.map((clause, i) => (
            <Text key={clause.title} style={styles.clause}>
              <Text style={styles.clauseTitle}>
                {i + 1}. {clause.title}.{" "}
              </Text>
              {clause.body}
            </Text>
          ))}
          <Text style={styles.attribution}>{STANDARD_TERMS_ATTRIBUTION}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated with Prelegal</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
