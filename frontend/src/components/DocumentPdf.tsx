"use client";

/**
 * Renders any document type as a print-ready PDF using @react-pdf/renderer:
 * filled cover page (sections, tables, parties) followed by the Standard Terms.
 * Produces real, selectable text.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { fieldValue } from "@/lib/buildDocument";
import {
  PARTY_FIELDS,
  valueOr,
  type DocumentDraft,
  type DocumentSpec,
} from "@/lib/documents";
import { parseMarkdownLines } from "@/lib/markdown";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.5, color: "#1e293b" },
  title: { fontSize: 18, fontWeight: 700, color: "#032147", marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#888888", marginBottom: 12 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#209dd7",
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 6,
  },
  fieldLabel: { fontSize: 8, color: "#64748b", marginTop: 4 },
  fieldValue: { fontSize: 10, color: "#1e293b" },
  row: { flexDirection: "row" },
  cell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    padding: 4,
    fontSize: 9,
  },
  cellHead: { backgroundColor: "#f1f5f9", fontWeight: 700, color: "#475569" },
  terms: { fontSize: 9, color: "#475569", marginBottom: 4 },
  termsHeading: {
    fontSize: 9,
    fontWeight: 700,
    color: "#032147",
    marginTop: 6,
    marginBottom: 2,
  },
  bold: { fontWeight: 700, color: "#1e293b" },
  divider: { borderTopWidth: 1, borderTopColor: "#cbd5e1", marginVertical: 14 },
});

export function DocumentPdf({
  spec,
  draft,
  standardTerms,
}: {
  spec: DocumentSpec;
  draft: DocumentDraft;
  standardTerms: string;
}) {
  const termsLines = parseMarkdownLines(standardTerms).filter(
    (line) => line.kind !== "blank",
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{spec.name}</Text>
        <Text style={styles.subtitle}>Cover Page</Text>

        {spec.sections.map((section) => (
          <View key={section.title} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.fields.map((field) => (
              <View key={field.key}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>
                  {valueOr(fieldValue(draft, field), field.label)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {spec.tables.map((table) => {
          const rows = draft.tables[table.key] ?? [];
          return (
            <View key={table.key}>
              <Text style={styles.sectionTitle}>{table.label}</Text>
              <View style={styles.row}>
                {table.columns.map((c) => (
                  <Text key={c.key} style={[styles.cell, styles.cellHead]}>
                    {c.label}
                  </Text>
                ))}
              </View>
              {(rows.length ? rows : [{}]).map((row, i) => (
                <View key={i} style={styles.row}>
                  {table.columns.map((c) => (
                    <Text key={c.key} style={styles.cell}>
                      {row[c.key] ?? ""}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Parties</Text>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.cellHead]} />
          {spec.parties.map((p) => (
            <Text key={p.role} style={[styles.cell, styles.cellHead]}>
              {p.label}
            </Text>
          ))}
        </View>
        {PARTY_FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.row}>
            <Text style={[styles.cell, styles.cellHead]}>{label}</Text>
            {spec.parties.map((p) => (
              <Text key={p.role} style={styles.cell}>
                {draft.parties[p.role]?.[key] ?? ""}
              </Text>
            ))}
          </View>
        ))}

        {termsLines.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Standard Terms</Text>
            {termsLines.map((line, i) => (
              <Text
                key={i}
                style={line.kind === "heading" ? styles.termsHeading : styles.terms}
              >
                {line.segments.map((seg, j) =>
                  seg.bold ? (
                    <Text key={j} style={styles.bold}>
                      {seg.text}
                    </Text>
                  ) : (
                    seg.text
                  ),
                )}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
