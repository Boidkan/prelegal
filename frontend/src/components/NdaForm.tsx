"use client";

import { useId, useState } from "react";
import type { NdaForm, Party } from "@/lib/nda";

type Props = {
  value: NdaForm;
  onChange: (next: NdaForm) => void;
};

const labelClass = "block text-sm font-medium text-slate-700 mb-1";
const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const yearInputClass =
  "w-16 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100";
const sectionClass =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
const sectionTitleClass =
  "text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4";

function Text({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Whole-number year input (minimum 1). Keeps a local text buffer so the field
 * can be cleared and retyped freely; commits valid numbers immediately and
 * clamps to a sensible value on blur.
 */
function YearInput({
  value,
  disabled,
  ariaLabel,
  onChange,
}: {
  value: number;
  disabled: boolean;
  ariaLabel: string;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));

  return (
    <input
      type="number"
      min={1}
      aria-label={ariaLabel}
      className={yearInputClass}
      disabled={disabled}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseInt(e.target.value, 10);
        if (!Number.isNaN(n) && n >= 1) onChange(n);
      }}
      onBlur={() => {
        const n = parseInt(text, 10);
        const clamped = Number.isNaN(n) || n < 1 ? 1 : n;
        setText(String(clamped));
        onChange(clamped);
      }}
    />
  );
}

function PartyFields({
  title,
  party,
  onChange,
}: {
  title: string;
  party: Party;
  onChange: (next: Party) => void;
}) {
  const set = (patch: Partial<Party>) => onChange({ ...party, ...patch });
  return (
    <div className={sectionClass}>
      <h3 className={sectionTitleClass}>{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text
          label="Print Name"
          value={party.name}
          onChange={(v) => set({ name: v })}
          placeholder="Jane Doe"
        />
        <Text
          label="Title"
          value={party.title}
          onChange={(v) => set({ title: v })}
          placeholder="CEO"
        />
        <Text
          label="Company"
          value={party.company}
          onChange={(v) => set({ company: v })}
          placeholder="Acme, Inc."
        />
        <Text
          label="Notice Address (email or postal)"
          value={party.noticeAddress}
          onChange={(v) => set({ noticeAddress: v })}
          placeholder="legal@acme.com"
        />
      </div>
    </div>
  );
}

export function NdaForm({ value, onChange }: Props) {
  const set = (patch: Partial<NdaForm>) => onChange({ ...value, ...patch });
  const purposeId = useId();
  const modificationsId = useId();

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Agreement Terms</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={purposeId} className={labelClass}>
              Purpose
            </label>
            <textarea
              id={purposeId}
              className={`${inputClass} min-h-20 resize-y`}
              value={value.purpose}
              onChange={(e) => set({ purpose: e.target.value })}
              placeholder="How Confidential Information may be used"
            />
          </div>

          <Text
            label="Effective Date"
            type="date"
            value={value.effectiveDate}
            onChange={(v) => set({ effectiveDate: v })}
          />

          <fieldset>
            <legend className={labelClass}>MNDA Term</legend>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mndaTerm"
                    checked={value.mndaTermKind === "expires"}
                    onChange={() => set({ mndaTermKind: "expires" })}
                  />
                  Expires
                </label>
                <YearInput
                  ariaLabel="MNDA term in years"
                  value={value.mndaTermYears}
                  disabled={value.mndaTermKind !== "expires"}
                  onChange={(n) => set({ mndaTermYears: n })}
                />
                <span>year(s) from the Effective Date</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="mndaTerm"
                  checked={value.mndaTermKind === "untilTerminated"}
                  onChange={() => set({ mndaTermKind: "untilTerminated" })}
                />
                Continues until terminated
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelClass}>Term of Confidentiality</legend>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="confidentiality"
                    checked={value.confidentialityKind === "years"}
                    onChange={() => set({ confidentialityKind: "years" })}
                  />
                  <span className="sr-only">Confidentiality term in years</span>
                </label>
                <YearInput
                  ariaLabel="Confidentiality term in years"
                  value={value.confidentialityYears}
                  disabled={value.confidentialityKind !== "years"}
                  onChange={(n) => set({ confidentialityYears: n })}
                />
                <span>year(s) from the Effective Date</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="confidentiality"
                  checked={value.confidentialityKind === "perpetuity"}
                  onChange={() => set({ confidentialityKind: "perpetuity" })}
                />
                In perpetuity
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Text
              label="Governing Law (state)"
              value={value.governingLaw}
              onChange={(v) => set({ governingLaw: v })}
              placeholder="Delaware"
            />
            <Text
              label="Jurisdiction"
              value={value.jurisdiction}
              onChange={(v) => set({ jurisdiction: v })}
              placeholder="New Castle, DE"
            />
          </div>

          <div>
            <label htmlFor={modificationsId} className={labelClass}>
              MNDA Modifications (optional)
            </label>
            <textarea
              id={modificationsId}
              className={`${inputClass} min-h-16 resize-y`}
              value={value.modifications}
              onChange={(e) => set({ modifications: e.target.value })}
              placeholder="List any modifications to the Standard Terms"
            />
          </div>
        </div>
      </div>

      <PartyFields
        title="Party 1"
        party={value.party1}
        onChange={(party1) => set({ party1 })}
      />
      <PartyFields
        title="Party 2"
        party={value.party2}
        onChange={(party2) => set({ party2 })}
      />
    </form>
  );
}
