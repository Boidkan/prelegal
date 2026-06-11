"use client";

import { useMemo } from "react";
import type { DocumentSpec } from "@/lib/documents";

/**
 * Visible list of supported document types, shown before a type is chosen so
 * users can browse and pick one (rather than having to guess what to type).
 * Picking one starts that document through the normal chat flow.
 */
export function DocumentPicker({
  specs,
  disabled,
  onPick,
}: {
  specs: DocumentSpec[];
  disabled: boolean;
  onPick: (spec: DocumentSpec) => void;
}) {
  const sorted = useMemo(
    () => [...specs].sort((a, b) => a.name.localeCompare(b.name)),
    [specs],
  );

  return (
    <div>
      <h2 className="text-sm font-semibold text-brand-navy">
        Choose a document to create
      </h2>
      <p className="mt-1 text-xs text-brand-gray">
        Pick one below, or just tell the assistant what you need.
      </p>

      <ul className="mt-4 space-y-2">
        {sorted.map((spec) => (
          <li key={spec.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(spec)}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-brand-blue hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="block text-sm font-medium text-brand-navy">
                {spec.name}
              </span>
              <span className="mt-0.5 block text-xs text-brand-gray">
                {spec.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
