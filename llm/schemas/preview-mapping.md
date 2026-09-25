# Preview mapping — `gantt`/`kpi` schema → frontend generic table format

The frontend's read-only Excel preview component expects a generic, flat shape:

```ts
{ sheets: [{ name: string, headers: string[], rows: (string | number | null)[][] }] }
```

This is **not** something the LLM should ever produce directly (it would duplicate
the extraction schema and drift from it). It's a **pure backend transform** applied
to the already-validated `gantt.schema.json` / `kpi.schema.json` JSON — same source
of truth (implementation-plan.md §2's "ίδιο JSON τροφοδοτεί frontend preview"), one
small mapping function per file type, no extra LLM call and no extra tokens.

This doc is the spec for that transform, so backend can implement it without having
to reverse-engineer the schema shapes.

## Gantt → 3 sheets

Mirrors the 3 real sheets in `docs/templates/EVOLVE2CARE_Gantt Chart (1).xlsx`.

### Sheet 1: `"M1-M{totalMonths} Overview"`

- `headers`: `["", "M1", "M2", ..., "M{totalMonths}"]` (first column blank/label column)
- One row per WP, followed by one row per task under it (same order as the source
  workbook groups WP1 then T1.1/T1.2/T1.3, etc.):
  - Column 0: the WP/task id (`"WP1"`, `"T1.1"`, ...)
  - For a WP row: for every month in `[monthFrom, monthTo]`, put `"WP"` (or any truthy
    marker the frontend renders as a filled cell); for every month present in
    `milestoneIds`' matching milestone's `dueMonth`, put the milestone id instead
    (e.g. `"MS1"`) — this reproduces the template's `J5: 'MS1'` marker cells.
  - For a task row: for every month covered by **any** of `phases[]`, put a marker
    (e.g. `"T"`); months in the gap between two phases stay blank. This is exactly
    why `phases[]` exists — a naive `monthFrom`/`monthTo` fill would wrongly mark the
    gap months as active.
  - Reporting-period boundaries (from `reportingPeriods[]`) aren't a cell value in the
    source template (they're a merged/colored header band — see `G17: 'REPORTING
    PERIOD 1'` in the real template) — the frontend can render that separately as a
    header annotation using `reportingPeriods[]` directly; no need to encode it per-cell.

### Sheet 2: `"Deliverables' List"`

- `headers`: `["Del No", "Title", "WP", "Lead Author", "Type", "Dissemination Level", "Due Date"]`
- One row per `deliverables[]` entry, columns in that order
  (`id, title, wp, leadBeneficiary, type, disseminationLevel, dueMonth`).

### Sheet 3: `"Milestones' List"`

- `headers`: `["Mil No", "Name", "WP", "Leader", "Means of verification", "Due Date"]`
- One row per `milestones[]` entry
  (`id, name, wp, leadBeneficiary, meansOfVerification, dueMonth`).

## KPI → one sheet per category

- `sheets[].name` = `categories[].name` (already the GA's verbatim heading, so it's a
  good sheet-tab name as-is).
- `headers`: `["Target", "Achieved", "M1", "M2", ..., "M{totalMonths}"]`
- Rows: flatten `groups[]` — for a group with a `label`, emit one row for the label as
  a section header (`[label, "", ...blank]`, mirroring the template's merged
  `"[C6.1]Twitter"` header cells) followed by one row per `kpis[]` entry
  (`label, target, achieved, ...monthlyValues`); for a group with no `label`, just emit
  its `kpis[]` rows directly, no header row.

## Notes

- This mapping is lossy on purpose (colors, merged cells, formulas are template-file
  concerns, not preview concerns) — the real, styled `.xlsx` still comes from
  `exceljs` filling the template directly from the same validated JSON, per
  implementation-plan.md §2. The preview only needs to *look* right in a plain table.
- If the frontend later needs the gap-vs-active distinction from `phases[]` to be
  visually different from a milestone marker (e.g. different cell color), that's a
  frontend rendering concern once it receives the marker strings above — no schema
  change needed.
