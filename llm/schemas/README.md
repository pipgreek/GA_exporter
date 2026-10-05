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
5. **INFO's `ownEntity`** exists because the INFO document is written from the
   perspective of *one* beneficiary — VILABS — even though the GA describes the whole
   consortium. `ownEntity` is **not an external parameter**: VILABS' legal form/country
   varies per grant (e.g. `VILABS (CY) LTD`, `VILABS OE`, a Bulgarian entity...), so the
   LLM itself must scan the GA's own Preamble/Data Sheet §2 participants list for a
   legal or short name containing "VILABS" and use that row.
6. **Missing information → literal `"tbd"`, never invented.** Every field that is
   plausibly absent from a given Grant Agreement's text (named personnel, a deliverable's
   dissemination level, a KPI's target, ...) has `"default": "tbd"` in the schema and is
   documented as such. The LLM must return `"tbd"` rather than fabricate a
   plausible-looking value — this keeps the extraction auditable and lets a human fill
   the gap later. Array fields with nothing found should be returned as an empty array,
   not an array of `"tbd"` placeholders. (Fields that are *never* present in a Grant
   Agreement at all — `website`, `socialMedia`, `repository`, `mailingLists`, named
   per-beneficiary `roles` — have been removed from `info.schema.json` entirely rather
   than kept as permanent `"tbd"` fields; see decision 11.)
7. **Retry is a backend concern, schemas just need to make retries meaningful.**
   Per implementation-plan.md §5.D, the backend retries a Zod-failed LLM call 1-2 times.
   Because unknown values now serialize to `"tbd"` (a valid string) instead of causing a
   required-field failure, a retry should only ever be triggered by a genuine schema
   violation (wrong type, malformed id pattern, invalid enum) — not by the GA simply
   lacking some piece of info. That distinction is what makes the retry worth doing.
8. **A Gantt task can be active in disjoint month ranges** (e.g. the real EVOLVE2CARE GA's
   T1.1: `"[M1-M4, M19-M24]"`). `gantt.schema.json` gives every task a `phases: [{monthFrom,
   monthTo}, ...]` array instead of a single `monthFrom`/`monthTo` pair, so a gap in the
   middle is representable as two phases rather than forcing one span that wrongly covers
   months the task isn't actually active in.
9. **KPI category (and group) names must be the GA's own heading, copied verbatim**
   (e.g. `"EXPECTED OUTCOME #1"`, not a paraphrase like `"Increase knowledge on..."`).
   This is what makes category identity stable across repeated extractions of the same
   Grant Agreement — required for the backend/frontend to treat two runs' categories as
   "the same category" rather than re-diffing free text every time.
10. **KPIs nest under `categories[].groups[].kpis[]`**, not a flat `categories[].kpis[]`.
    A `group` mirrors a real sub-heading in the source (e.g. a bracket-coded
    `"[C6.1]Twitter"` block, as seen in the VIGILANCE workbook) and carries an optional
    `label` for it. A category with no natural sub-grouping (most Expected-Outcome-style
    blocks) still gets exactly one group, just with no `label` — so the shape is uniform
    even though real GAs vary in how deep their indicator sections nest.
11. **INFO has no sections with no GA source — removed, not left as permanent `"tbd"`.**
    Per a 2026-10 rendering-requirements note, the INFO document no longer has a
    links/socials section or a Roles section at all, so `website`, `socialMedia`,
    `repository`, `mailingLists` and `roles` were deleted from `info.schema.json` outright
    (they always resolved to `"tbd"`/`[]` anyway, since none of that information is ever in
    a Grant Agreement's own text). In their place: `ownEntityTotalPersonMonths` and
    `workPackages[].ownEntityPersonMonths` (from Annex 1 Part A's "Staff effort per
    participant" matrix, ownEntity's row) drive a hierarchical Total → per-WP → per-task
    "VIL Efforts" section instead of one free-text paragraph; `ownEffortSummary` is now
    just a one-line intro. `workPackages[].tasks[].participants` (verbatim from each
    task's own "Partners involved: ..." annotation, e.g. `["ALL"]`) is what the rendered
    document uses to bold exactly the WPs/tasks ownEntity is actually involved in — every
    WP and task is still included regardless of involvement, only the emphasis differs.
12. **Gantt `deliverables[].taskId` went from "best-effort, omit if unsure" to "set it
    whenever the WP has tasks".** A rendering requirement that the Gantt Overview sheet
    only ever shows deliverables on task rows (never a WP row) means an absent `taskId`
    is no longer a safe, equally-valid fallback — it's now a rendering gap. The guidance
    is now two-tier: textual/thematic match first (as before), then a deterministic
    temporal fallback (the task in that WP whose `phases[]` cover the deliverable's
    `dueMonth`, lowest task id breaking ties) so a confident placement exists even when
    the text gives no explicit textual link. `taskId` stays optional in the schema only
    for the genuine edge case of a WP with zero tasks (e.g. an Ethics-requirements WP).

## Template and extraction follow-ups

The HTTP transport/API contract is locked in [`../../docs/api-contract.md`](../../docs/api-contract.md). These remaining items affect template capacity and extraction coverage, not the upload/status/preview/download response shapes.

- Max `totalMonths` / WP count the Excel templates should support without breaking
  merged-cell layout (implementation-plan.md §7).
- Whether `deliverables[].type` / `disseminationLevel` enums need more values than the
  ones observed across the two sample GAs (`R`, `DEC`, `DMP`, `ETHICS`, `OTHER` /
  `PU`, `SEN`, `EU-R`, `EU-C`, `EU-S`).

## Resolved

- ~~Whether KPI `groupLabel` should instead be a nested `groups[]` array~~ — resolved,
  see design decision 10 above.
- ~~Whether category names should be free-text or the GA's verbatim heading~~ — resolved,
  see design decision 9 above.
- ~~Non-contiguous task month ranges~~ — resolved, see design decision 8 above.
- ~~Who produces the frontend's generic preview shape~~ — resolved: a backend transform
  on top of the already-validated JSON, not the LLM. See [`preview-mapping.md`](preview-mapping.md)
  for the exact mapping spec.
