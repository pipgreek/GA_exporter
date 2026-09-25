# JSON Schemas — GA Exporter

Three schemas, one per output file type. Each is the contract between the LLM
extraction step (Claude Haiku, tool-use/structured output), the Zod validation
on the backend, and the template-filling engine (docxtemplater / exceljs).

- [`info.schema.json`](info.schema.json) → INFO Word document
- [`gantt.schema.json`](gantt.schema.json) → Gantt Excel (`docs/templates/EVOLVE2CARE_Gantt Chart (1).xlsx`)
- [`kpi.schema.json`](kpi.schema.json) → KPI Excel (`docs/templates/VIGILANCE-Monitoring & KPIs.xlsx`)

## Source material used to design these

- `docs/Παραδείγματα/Grant Agreement - GAP-101158152 (1) (1) (2).pdf` — real GA (EVOLVE2CARE), the kind of PDF the app parses.
- `docs/Παραδείγματα/evolve2care info tab (2).pdf` — filled INFO example.
- `docs/templates/evolve2care info tab (2) (1).docx` — the actual (draft) INFO Word template, with `{XXXXXXXX}` / `{Task X.X}` placeholders.
- `docs/templates/EVOLVE2CARE_Gantt Chart (1).xlsx` — the actual Gantt template (`M1-M24 Overview`, `Deliverables' List`, `Milestones' List` sheets).
- `docs/templates/VIGILANCE-Monitoring & KPIs.xlsx` — a **live, in-use** KPI workbook (different project) showing the real shape of a KPI sheet: bracket-coded indicators (`[C1]`, `[D6.1]`…), free-text targets, monthly tracking columns, `COUNTIFS`/`SUM` "Achieved" formulas.

## Design decisions

1. **Month numbers, not dates, drive the Gantt/KPI layout.** The GA itself expresses
   everything as `M1`–`M24` relative to project start (Data Sheet duration). Calendar
   labels (`M1 - OCT`) are cosmetic and computed from `projectStartDate` at render time,
   not extracted per cell.
2. **The current Gantt/KPI templates are hand-built for one project's shape**
   (24 months, WP1–WP6, D1.1–D6.1 / 36 months for VIGILANCE's KPI sheet). The schemas
   are deliberately generic (arrays, no fixed WP/month count) — the backend template
   engine is responsible for duplicating rows/columns to fit `totalMonths` /
   `workPackages.length` (see implementation-plan.md §7, open point "Μέγιστο εύρος
   μηνών/WPs"). This is a backend/template concern, not a schema concern.
3. **KPI `achieved` / `monthlyValues` are always empty at generation time.** The Grant
   Agreement is a planning document — it states *targets*, not progress. The LLM should
   never invent numbers here; it only extracts the target text and the category/label
   structure. The array is pre-sized to `totalMonths` so the generated workbook has the
   right number of tracking columns from day one.
4. **`target` is a string, not a number**, because real GA targets are compound/qualitative
   (`"Y1: >1500 entries"`, `">1000 followers"`, `"1 Rollup"`). Forcing a numeric type would
   lose information or require lossy parsing that the LLM would get wrong.
5. **INFO `roles` and `ownEntity`** exist because the INFO document is written from the
   perspective of *one* beneficiary — VILABS — even though the GA describes the whole
   consortium. `ownEntity` is **not an external parameter**: VILABS' legal form/country
   varies per grant (e.g. `VILABS (CY) LTD`, `VILABS OE`, a Bulgarian entity...), so the
   LLM itself must scan the GA's own Preamble/Data Sheet §2 participants list for a
   legal or short name containing "VILABS" and use that row.
6. **Missing information → literal `"tbd"`, never invented.** Every field that is
   plausibly absent from a given Grant Agreement's text (website, social media,
   repository, mailing lists, named personnel, a deliverable's dissemination level, a
   KPI's target, ...) has `"default": "tbd"` in the schema and is documented as such.
   The LLM must return `"tbd"` rather than fabricate a plausible-looking value — this
   keeps the extraction auditable and lets a human fill the gap later. Array fields with
   nothing found (e.g. no named `roles` in the GA) should be returned as an empty array,
   not an array of `"tbd"` placeholders.
7. **Retry is a backend concern, schemas just need to make retries meaningful.**
   Per implementation-plan.md §5.D, the backend retries a Zod-failed LLM call 1-2 times.
   Because unknown values now serialize to `"tbd"` (a valid string) instead of causing a
   required-field failure, a retry should only ever be triggered by a genuine schema
   violation (wrong type, malformed id pattern, invalid enum) — not by the GA simply
   lacking some piece of info. That distinction is what makes the retry worth doing.

## Open points (need decision before backend/frontend lock the contract)

- Max `totalMonths` / WP count the Excel templates should support without breaking
  merged-cell layout (implementation-plan.md §7).
- Whether `deliverables[].type` / `disseminationLevel` enums need more values than the
  ones observed across the two sample GAs (`R`, `DEC`, `DMP`, `ETHICS`, `OTHER` /
  `PU`, `SEN`, `EU-R`, `EU-C`, `EU-S`).
- Whether KPI `groupLabel` should instead be a nested `groups[]` array (one level of
  grouping under each category) rather than a flat `kpis[]` with a repeated label —
  flat was chosen to stay a 1:1 match with `categories[{name, kpis[]}]` already agreed
  in `docs/implementation-plan.md`, but nested reads closer to the actual sheets.
- Whether the frontend's generic preview shape `{ sheets: [{ name, headers, rows }] }`
  should be produced by a small backend transform on top of `gantt.schema.json` /
  `kpi.schema.json` (recommended — keeps one source of truth) or whether the LLM should
  emit both shapes.
