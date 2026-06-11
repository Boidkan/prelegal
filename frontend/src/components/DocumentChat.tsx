"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { ApiError, api, type ChatMessage } from "@/lib/api";
import { buildDocumentMarkdown } from "@/lib/buildDocument";
import {
  documentFilename,
  emptyDraft,
  type DocumentDraft,
  type DocumentSpec,
} from "@/lib/documents";
import { downloadBlob } from "@/lib/download";

const ERROR_REPLY =
  "Sorry — I had trouble just then. Could you try sending that again?";

/**
 * The document chat creator: a conversation that detects the document type,
 * gathers its fields, and drives a live preview. Reuses one generic preview /
 * Markdown / PDF path for all 11 document types.
 */
export function DocumentChat({
  onActiveTypeChange,
}: {
  onActiveTypeChange?: (spec: DocumentSpec | null) => void;
}) {
  const [specs, setSpecs] = useState<Record<string, DocumentSpec>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<DocumentDraft>(emptyDraft);
  const [terms, setTerms] = useState<Record<string, string>>({});
  // Tracks which type ids have had their Standard Terms fetch started.
  const termsRequested = useRef<Set<string>>(new Set());
  const [busy, setBusy] = useState(true);
  const [complete, setComplete] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const activeSpec = draft.typeId ? specs[draft.typeId] ?? null : null;
  const activeTerms = draft.typeId ? terms[draft.typeId] ?? "" : "";

  // Load the document specs and the greeting once.
  useEffect(() => {
    let active = true;
    Promise.all([api.documents.types(), api.chat.greeting()])
      .then(([typeList, greeting]) => {
        if (!active) return;
        setSpecs(Object.fromEntries(typeList.map((s) => [s.id, s])));
        setMessages([{ role: "assistant", content: greeting.reply }]);
      })
      .catch(() => {
        if (active)
          setMessages([
            { role: "assistant", content: "Hi! What kind of document would you like to create?" },
          ]);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onActiveTypeChange?.(activeSpec);
  }, [activeSpec, onActiveTypeChange]);

  // Fetch Standard Terms once per chosen type (needed for preview + download).
  useEffect(() => {
    const id = draft.typeId;
    if (!id || termsRequested.current.has(id)) return;
    termsRequested.current.add(id);
    api.documents
      .standardTerms(id)
      .then((res) => setTerms((prev) => ({ ...prev, [id]: res.text })))
      .catch(() => setTerms((prev) => ({ ...prev, [id]: "" })));
  }, [draft.typeId]);

  const send = async (text: string) => {
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await api.chat.sendMessage(next, draft);
      setMessages([...next, { role: "assistant", content: res.reply }]);
      setDraft(res.draft);
      setComplete(res.complete);
    } catch (error) {
      const detail = error instanceof ApiError ? error.message : ERROR_REPLY;
      setMessages([...next, { role: "assistant", content: detail }]);
    } finally {
      setBusy(false);
    }
  };

  const downloadMarkdown = () => {
    if (!activeSpec) return;
    const blob = new Blob([buildDocumentMarkdown(activeSpec, draft, activeTerms)], {
      type: "text/markdown;charset=utf-8",
    });
    downloadBlob(blob, documentFilename(activeSpec, draft, "md"));
  };

  const downloadPdf = async () => {
    if (!activeSpec) return;
    setGeneratingPdf(true);
    try {
      const [{ pdf }, { DocumentPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/DocumentPdf"),
      ]);
      const blob = await pdf(
        <DocumentPdf spec={activeSpec} draft={draft} standardTerms={activeTerms} />,
      ).toBlob();
      downloadBlob(blob, documentFilename(activeSpec, draft, "pdf"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadsDisabled = useMemo(() => !complete || !activeSpec, [complete, activeSpec]);

  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
      <section aria-label="Chat" className="h-[calc(100vh-9rem)]">
        <ChatPanel messages={messages} busy={busy} onSend={send} />
      </section>

      <section aria-label="Document preview" className="flex flex-col gap-3">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={downloadMarkdown}
            disabled={downloadsDisabled}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Markdown
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloadsDisabled || generatingPdf}
            className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingPdf ? "Generating…" : "Download PDF"}
          </button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {activeSpec ? (
            <DocumentPreview spec={activeSpec} draft={draft} standardTerms={activeTerms} />
          ) : (
            <p className="text-sm text-brand-gray">
              Your document will appear here once we’ve settled on a type. Tell
              the assistant what you’d like to create.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
