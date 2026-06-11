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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
      {label}
    </h4>
    <p className="text-sm text-slate-800">{children}</p>
  </div>
);

const PartyColumn = ({ heading, party }: { heading: string; party: Party }) => (
  <div className="flex-1">
    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {heading}
    </p>
    <dl className="space-y-1 text-sm text-slate-800">
      <div>
        <dt className="inline text-slate-500">Name: </dt>
        <dd className="inline">{party.name || "—"}</dd>
      </div>
      <div>
        <dt className="inline text-slate-500">Title: </dt>
        <dd className="inline">{party.title || "—"}</dd>
      </div>
      <div>
        <dt className="inline text-slate-500">Company: </dt>
        <dd className="inline">{party.company || "—"}</dd>
      </div>
      <div>
        <dt className="inline text-slate-500">Notice Address: </dt>
        <dd className="inline">{party.noticeAddress || "—"}</dd>
      </div>
      <div className="pt-2">
        <dt className="text-slate-500">Signature:</dt>
        <dd className="mt-3 border-b border-slate-300" />
      </div>
    </dl>
  </div>
);

export function NdaPreview({ form }: { form: NdaForm }) {
  return (
    <article className="prose-sm mx-auto max-w-none text-slate-800">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
          Prelegal
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Mutual Non-Disclosure Agreement
        </h2>
        <p className="mt-2 text-xs text-slate-500">{COVER_PAGE_INTRO}</p>
      </header>

      <section>
        <Field label="Purpose">
          {orPlaceholder(form.purpose, "How Confidential Information may be used")}
        </Field>
        <Field label="Effective Date">
          {formatEffectiveDate(form.effectiveDate)}
        </Field>
        <Field label="MNDA Term">{mndaTermText(form)}</Field>
        <Field label="Term of Confidentiality">
          {confidentialityText(form)}
        </Field>
        <Field label="Governing Law">
          {orPlaceholder(form.governingLaw, "state")}
        </Field>
        <Field label="Jurisdiction">
          {orPlaceholder(form.jurisdiction, "city or county and state")}
        </Field>
        <Field label="MNDA Modifications">{modificationsText(form)}</Field>
      </section>

      <section className="mt-6 border-t border-slate-200 pt-4">
        <p className="mb-4 text-sm text-slate-600">
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
          <PartyColumn heading="Party 1" party={form.party1} />
          <PartyColumn heading="Party 2" party={form.party2} />
        </div>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">
          {STANDARD_TERMS_HEADING}
        </h3>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
          {STANDARD_TERMS.map((clause) => (
            <li key={clause.title}>
              <span className="font-semibold">{clause.title}.</span> {clause.body}
            </li>
          ))}
        </ol>
        <p className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500">
          {STANDARD_TERMS_ATTRIBUTION}
        </p>
      </section>
    </article>
  );
}
