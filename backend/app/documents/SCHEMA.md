# Document spec format

Each supported document type is described by one JSON file in `specs/<id>.json`
and one verbatim Standard Terms file in `standard_terms/<id>.md`. The registry
loads every `specs/*.json`; the chat engine uses the spec to guide field
collection, and the frontend renders the cover page from it.

## `specs/<id>.json`

```jsonc
{
  "id": "kebab-case-id",            // matches the filename and standard_terms/<id>.md
  "name": "Human Name",             // from catalog.json
  "description": "One sentence.",    // from catalog.json
  "keywords": ["alias", "phrase"],  // lowercase terms that signal this type (for detection)
  "parties": [                       // the signing parties / roles, in order
    { "role": "provider", "label": "Provider" },
    { "role": "customer", "label": "Customer" }
  ],
  "sections": [                      // groups of single-value fields (the cover page / order form)
    {
      "title": "Order Form",
      "fields": [
        {
          "key": "effectiveDate",   // camelCase, unique within the spec
          "label": "Effective Date",
          "type": "date",            // text | multiline | date | number | currency | percent | choice
          "required": true,          // required for completeness
          "help": "When the agreement takes effect.",  // optional, shown to the model + UI
          "options": ["A", "B"],     // REQUIRED when type == "choice", else omit
          "default": "..."           // optional pre-filled value (e.g. a standard purpose)
        }
      ]
    }
  ],
  "tables": [                        // repeating/nested structures (omit or [] if none)
    {
      "key": "feeSchedule",
      "label": "Fees",
      "required": false,             // if true, needs >= 1 row for completeness
      "columns": [
        { "key": "description", "label": "Description", "type": "text" },
        { "key": "amount", "label": "Amount", "type": "currency" }
      ]
    }
  ]
}
```

### Field types
- `text` — short free text
- `multiline` — long free text (paragraphs)
- `date` — ISO `YYYY-MM-DD`
- `number` — integer/decimal
- `currency` — a monetary amount (string, may include currency symbol)
- `percent` — a percentage
- `choice` — one of `options`

### Conventions
- Every party gets the standard sub-fields `name`, `title`, `company`,
  `noticeAddress`; do not list them as section fields.
- Mark a field `required: true` only if the document is meaningfully incomplete
  without it (parties' name/company/notice address are handled separately and
  are always required).
- Keep `keywords` focused (the document's distinctive words), lowercase.

## `standard_terms/<id>.md`

The verbatim static legal text (the "Standard Terms" / main agreement body) for
the type, copied from `templates/<file>.md`. EXCLUDE the fillable cover
page / order form section (the part with `[placeholders]`, `<label>` tags, and
`[ ]`/`[x]` checkboxes) — that is regenerated from collected values. Keep all
numbered clauses and headings intact. This text is embedded into the downloaded
document after the filled cover page.
