"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { NdaPreview } from "@/components/NdaPreview";
import { ApiError, api, type ChatMessage } from "@/lib/api";
import { buildMarkdown, ndaFilename } from "@/lib/buildMarkdown";
import { downloadBlob } from "@/lib/download";
import { defaultNdaForm, type NdaForm } from "@/lib/nda";

const ERROR_REPLY =
  "Sorry — I had trouble just then. Could you try sending that again?";

/**
 * The Mutual NDA chat creator: a conversation on the left that drives a live
 * document preview on the right. The backend extracts fields from each message
 * and returns the merged draft, which we render and (once complete) export.
 */
export function NdaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [form, setForm] = useState<NdaForm>(defaultNdaForm);
  const [busy, setBusy] = useState(true);
  const [complete, setComplete] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch the assistant's opening message once.
  useEffect(() => {
    let active = true;
    api.chat
      .greeting()
      .then((res) => {
        if (active) setMessages([{ role: "assistant", content: res.reply }]);
      })
      .catch(() => {
        if (active)
          setMessages([
            { role: "assistant", content: "Hi! Tell me about the NDA you'd like to create." },
          ]);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const send = async (text: string) => {
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await api.chat.sendMessage(next, form);
      setMessages([...next, { role: "assistant", content: res.reply }]);
      setForm(res.draft);
      setComplete(res.complete);
    } catch (error) {
      const detail =
        error instanceof ApiError ? error.message : ERROR_REPLY;
      setMessages([...next, { role: "assistant", content: detail }]);
    } finally {
      setBusy(false);
    }
  };

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
    <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
      <section aria-label="Chat" className="h-[calc(100vh-9rem)]">
        <ChatPanel messages={messages} busy={busy} onSend={send} />
      </section>

      <section aria-label="NDA preview" className="flex flex-col gap-3">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={downloadMarkdown}
            disabled={!complete}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Markdown
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!complete || generatingPdf}
            className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingPdf ? "Generating…" : "Download PDF"}
          </button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <NdaPreview form={form} />
        </div>
      </section>
    </main>
  );
}
