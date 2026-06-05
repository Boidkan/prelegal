"use client";

import { useState } from "react";
import { NdaForm } from "@/components/NdaForm";
import { NdaPreview } from "@/components/NdaPreview";
import { buildMarkdown, ndaFilename } from "@/lib/buildMarkdown";
import { defaultNdaForm, type NdaForm as NdaFormData } from "@/lib/nda";

/** Trigger a browser download for an in-memory Blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Defer revocation so the browser can start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function NdaCreator() {
  const [form, setForm] = useState<NdaFormData>(defaultNdaForm);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const downloadMarkdown = () => {
    const blob = new Blob([buildMarkdown(form)], {
      type: "text/markdown;charset=utf-8",
    });
    downloadBlob(blob, ndaFilename(form, "md"));
  };

  const downloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      // Imported on demand: @react-pdf/renderer is browser-only and heavy.
      const [{ pdf }, { NdaDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/NdaDocument.pdf"),
      ]);
      const blob = await pdf(<NdaDocument form={form} />).toBlob();
      downloadBlob(blob, ndaFilename(form, "pdf"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Prelegal
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              Mutual NDA Creator
            </h1>
            <p className="text-sm text-slate-500">
              Fill in the details, preview your agreement, and download it.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={downloadMarkdown}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Download Markdown
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={generatingPdf}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingPdf ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-2">
        <section aria-label="NDA details form">
          <NdaForm value={form} onChange={setForm} />
        </section>
        <section
          aria-label="NDA preview"
          className="lg:sticky lg:top-8 lg:self-start"
        >
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <NdaPreview form={form} />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 text-center text-xs text-slate-400">
        Based on the{" "}
        <a
          className="underline hover:text-slate-600"
          href="https://commonpaper.com/standards/mutual-nda/1.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Common Paper Mutual NDA (v1.0)
        </a>
        , free to use under CC BY 4.0.
      </footer>
    </div>
  );
}
