"use client";

import { Fragment } from "react";
import { fieldValue } from "@/lib/buildDocument";
import {
  PARTY_FIELDS,
  valueOr,
  type DocumentDraft,
  type DocumentSpec,
} from "@/lib/documents";
import { parseMarkdownLines, type Segment } from "@/lib/markdown";

/** Render inline segments (bold / link / text) as React nodes. */
function renderSegments(segments: Segment[]) {
  return segments.map((seg, i) => {
    if (seg.href) {
      return (
        <a
          key={i}
          href={seg.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue underline"
        >
          {seg.text}
        </a>
      );
    }
    if (seg.bold) {
      return (
        <strong key={i} className="font-semibold text-slate-800">
          {seg.text}
        </strong>
      );
    }
    return <Fragment key={i}>{seg.text}</Fragment>;
  });
}

/**
 * Live, read-only rendering of the document: the filled cover page on top, then
 * the verbatim Standard Terms once loaded. Driven entirely by the spec + draft.
 */
export function DocumentPreview({
  spec,
  draft,
  standardTerms,
}: {
  spec: DocumentSpec;
  draft: DocumentDraft;
  standardTerms: string;
}) {
  return (
    <article className="prose-sm max-w-none text-slate-800">
      <h2 className="text-xl font-bold text-brand-navy">{spec.name}</h2>
      <p className="mt-1 text-xs text-brand-gray">Cover Page</p>

      {spec.sections.map((section) => (
        <section key={section.title} className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            {section.title}
          </h3>
          <dl className="mt-2 space-y-2">
            {section.fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
                <dd className="whitespace-pre-wrap text-sm text-slate-800">
                  {valueOr(fieldValue(draft, field), field.label)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {spec.tables.map((table) => {
        const rows = draft.tables[table.key] ?? [];
        return (
          <section key={table.key} className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
              {table.label}
            </h3>
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr>
                  {table.columns.map((c) => (
                    <th
                      key={c.key}
                      className="border border-slate-200 bg-slate-50 px-2 py-1 text-left text-xs font-medium text-slate-600"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={table.columns.length}
                      className="border border-slate-200 px-2 py-1 text-xs text-brand-gray"
                    >
                      —
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i}>
                      {table.columns.map((c) => (
                        <td
                          key={c.key}
                          className="border border-slate-200 px-2 py-1 text-slate-800"
                        >
                          {row[c.key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        );
      })}

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
          Parties
        </h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-200 px-2 py-1" />
              {spec.parties.map((p) => (
                <th
                  key={p.role}
                  className="border border-slate-200 bg-slate-50 px-2 py-1 text-left text-xs font-medium text-slate-600"
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARTY_FIELDS.map(({ key, label }) => (
              <tr key={key}>
                <td className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                  {label}
                </td>
                {spec.parties.map((p) => (
                  <td
                    key={p.role}
                    className="border border-slate-200 px-2 py-1 text-slate-800"
                  >
                    {draft.parties[p.role]?.[key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {standardTerms && (
        <section className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            Standard Terms
          </h3>
          <div className="mt-2 text-xs leading-relaxed text-slate-600">
            {parseMarkdownLines(standardTerms).map((line, i) => {
              if (line.kind === "blank") return <div key={i} className="h-2" />;
              if (line.kind === "heading") {
                return (
                  <p key={i} className="mt-3 font-semibold text-brand-navy">
                    {renderSegments(line.segments)}
                  </p>
                );
              }
              return (
                <p key={i} className="whitespace-pre-wrap">
                  {renderSegments(line.segments)}
                </p>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
