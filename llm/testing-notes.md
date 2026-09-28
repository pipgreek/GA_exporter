# Live API test — 2026-09-28

First real run of the three request packages (`llm/prompts/*.request.json`) against
the live Anthropic API, using the full, untrimmed backend parser output
(`docs/Παραδείγματα/Grant Agreement - GAP-101158152.md`, 419,981 chars / 5,955 lines)
as `{{grant_agreement_markdown}}`. Closes the "not tested against the live API" item
in `llm/prompts/README.md` and `implementation-plan.md` §5 (llm branch).

## Result: all three calls succeeded, all three outputs are schema-valid

| Call | `stop_reason` | Input tokens | Output tokens |
|---|---|---|---|
| `generate_info_json` | `tool_use` | 107,550 | 2,603 |
| `generate_gantt_json` | `tool_use` | 106,996 | 4,468 |
| `generate_kpi_json` | `tool_use` | 106,755 | 5,198 |

Validated with `jsonschema.Draft7Validator` against `llm/schemas/*.schema.json` —
**0 errors** across all three. No retries were needed.

Raw outputs are saved in [`llm/examples/live-run-2026-09-28/`](examples/live-run-2026-09-28/)
(`info.output.json`, `gantt.output.json`, `kpi.output.json`) as a regression fixture
alongside the pre-existing hand-built examples in `llm/examples/*.example.md` (those
remain useful as an independently-derived "what correct looks like" check).

## Quality spot-check

Cross-checked against the real reference material in `docs/Παραδείγματα/` and
`docs/1-4.png` (the actual EVOLVE2CARE info tab / Gantt / KPI screenshots):

- **info**: `gaNumber`, `projectAcronym`, WP1-WP6 names/leads/months, and
  `ownEntity` (correctly self-identified VILABS (CY) LTD, PIC 917943205, role BEN,
  by scanning the participants table with no PIC/entity handed to it) all match the
  real info tab. `ownEffortSummary` correctly scoped to WP4/T4.1-4.3 only — did not
  copy the broader "assigned to all WPs except WP6" claim from the internal Teams
  page, because that claim isn't stated in the GA text itself. `roles: []` correctly
  empty (no VILABS-affiliated individuals are named in this GA's text).
- **gantt**: milestones MS1-MS3 match the reference Excel exactly (id, WP, lead,
  means of verification, due month). Deliverables: 26 extracted (reference Excel had
  24 — plausible version drift between the sample Excel and this GA text, not
  re-verified against the PDF page-by-page). Non-contiguous task ranges work as
  designed, e.g. T1.1 → `phases: [[1,4],[19,24]]` (was the motivating edge case for
  the `phases[]` array design).
- **kpi**: 13 categories (7 `EXPECTED OUTCOME #n` + 6 communication/dissemination
  tool categories). Correctly returned **one ungrouped group** per category instead
  of inventing sub-groups — this GA's indicators table has no bracket-coded
  sub-headings (unlike the VIGILANCE reference sheet, which is a *later-stage*
  monitoring artifact, not something present at GA-signature stage). `achieved: 0`
  and `monthlyValues` = 24 `null`s throughout, computed mechanically as instructed,
  not read from text.

**No prompt or schema changes were needed** — this run validates the existing rules
(§6 page-break/table-continuation handling, lead-beneficiary prefix stripping,
type/dissemination-level code extraction) rather than exposing new gaps.

> **Update (same day, found via the rendered INFO Word doc):** the above was
> wrong for one field. `info.schema.json`'s `workPackages[].tasks[].leader` /
> `monthFrom` / `monthTo` were present in the schema and *did* validate, but the
> original `INFO_SYSTEM` prompt only had a throwaway clause ("...which state
> each task's leader and month range") — the model was silently omitting
> `leader` for every task, and collapsing multi-phase tasks like `T1.1.
> [M1-M4, M19-M24] | Leader: Sploro` down to just the first phase
> (`monthFrom:1, monthTo:4`), even though the source markdown states the
> leader and full range explicitly (`docs/Παραδείγματα/Grant Agreement -
> GAP-101158152.md:2586`). Schema validation didn't catch this because
> `leader`/`monthFrom`/`monthTo` are legitimately optional at the task level
> (a task with no stated leader is valid) — so this was silent data loss, not
> a validation failure.
>
> Fixed in `llm/prompts/build_requests.py`'s `INFO_SYSTEM`: replaced the
> throwaway clause with an explicit rule quoting the exact inline-annotation
> pattern (`"T1.1. ... [M1-M4, M19-M24] | Leader: Sploro | Partners involved:
> ALL"`), instructing the model to always extract the leader and — since this
> schema has no per-task `phases[]` array (unlike Gantt) — to span
> `monthFrom`/`monthTo` from the first phase's start to the last phase's end
> rather than dropping the field. Regenerated `llm/prompts/info.request.json`
> via `build_requests.py` and re-ran only the info call: `T1.1` now correctly
> returns `{ leader: 'SPLORO', monthFrom: 1, monthTo: 24 }`. Re-validated
> against `info.schema.json` (0 errors) and `llm/examples/live-run-2026-09-28/
> info.output.json` was updated to this corrected output. `gantt`/`kpi` were
> unaffected (their own prompts already had per-task `phases[]`/leader
> handling) and were not re-run.
>
> **Lesson:** schema-valid isn't the same as complete — a spot-check against
> the *rendered document*, not just `jsonschema.validate()`, is what actually
> caught this.

## Enum coverage observed (single GA, so partial)

- `deliverables[].type`: **5 of 6** enum values seen in real data — `R`, `DEC`,
  `DMP`, `ETHICS`, `OTHER` (only `tbd` unseen, as expected — it's the fallback).
- `deliverables[].disseminationLevel`: **2 of 6** — `PU`, `SEN`. `EU-R`/`EU-C`/`EU-S`
  (the newer classified-info levels) remain unverified against real GA text; keep
  the enum as-is since it mirrors the official EU Portal codes, not something to
  narrow based on one sample.

## Token budget — finalized for now

`max_tokens: 8192` in all three request packages is confirmed generous: actual
usage topped out at 5,198 (kpi, the largest). **No change recommended** — keep
8192 as headroom for larger consortia (more WPs/tasks/deliverables/KPI categories
than this 6-WP/26-deliverable/13-category sample), rather than tuning it down to
observed usage on a single mid-size GA.

## Template month/WP ceiling — confirmed, not yet a blocker

This GA is 24 months / 6 WPs, matching the hand-built Gantt/KPI Excel templates
(`docs/templates/`) exactly. The open question in `implementation-plan.md` §7 (max
months/WPs the *render engine* must support for larger consortia) is unchanged by
this test — it's a backend rendering concern, not an extraction one, and no GA
larger than this sample has been tested yet.

## Real-world cost, measured (updates the earlier estimate)

This GA (~108K input tokens per call — larger than the ~25-40K/call estimate in
earlier planning discussion, because the full pdfplumber markdown is sent verbatim
with no trimming/summarization) actually costs, at Haiku 4.5 rates ($1/MTok in,
$5/MTok out):

```
Input:  3 × 107,100 avg tokens ≈ 321,300 / 1,000,000 × $1 = $0.321
Output: 2,603 + 4,468 + 5,198 = 12,269 / 1,000,000 × $5   = $0.061
──────────────────────────────────────────────────────────────────
Total for this one Grant Agreement ≈ $0.38
```

Still cheap in absolute terms, but ~2.5-3x the earlier back-of-envelope estimate.
Worth noting for `implementation-plan.md` §7 budget-cap sizing; not a blocker.

## Next steps (backend branch, unblocked by this)

1. Anthropic SDK integration wiring these exact request packages into
   `generate<Name>Json()` (implementation-plan.md §5.D) — no schema/prompt changes
   needed first.
2. Zod validation mirroring `llm/schemas/*.schema.json` (§5.E).
3. Template placeholder work (§5.F) can proceed independently — the JSON shape
   feeding it is now confirmed stable against real data.

## Second GA test — 2026-09-30 (VIGILANCE, GAP-101249737)

First test against a real GA other than EVOLVE2CARE: 36 months, 8 WPs, 50
deliverables, 20 milestones (vs EVOLVE2CARE's 24/6/26/3) — a meaningfully
bigger, structurally different project. Found three real issues the single
first sample hadn't exposed:

1. **Context window overflow.** Raw pdfplumber markdown for this GA is 761K
   chars (~214K tokens) — over Claude's 200K token limit — so all three
   calls failed outright (`400 prompt is too long`). This directly
   contradicts the earlier "chunking not needed" conclusion above, which was
   only ever validated on one, smaller GA — that conclusion is now corrected
   by this section, not still accurate.
   **Fix:** added `trim_boilerplate()` to
   `backend/src/pdf-parsing/extract_to_markdown.py`. None of the three
   extraction prompts read the generic Terms & Conditions article body or
   the trailing Annex 2+ (budget/accession/financial-form templates) — only
   Preamble + Data Sheet + Annex 1 (Part A + Part B) matter. Anchored on
   standard Horizon Europe/Euratom template headings (`ARTICLE 1 — SUBJECT
   OF THE AGREEMENT`, `DESCRIPTION OF THE ACTION (PART A)`, `ANNEX 2`),
   confirmed identical across both real sample GAs; falls back to a no-op if
   an anchor isn't found, so a differently-laid-out GA is never silently
   corrupted. Cut this GA to 563K chars (~162K tokens/call, comfortably under
   the limit) and EVOLVE2CARE to 248K chars as a bonus regression check.
2. **Output truncation.** Even after trimming, `gantt` hit
   `stop_reason: max_tokens` at the old `max_tokens: 8192` — this GA's larger
   Gantt data didn't fit, and the JSON was truncated mid-generation (missing
   the entire `milestones` array — schema-invalid, not just incomplete).
   **Fix:** raised `max_tokens` to `16384` for all three request packages.
   Re-ran: `gantt` finished cleanly at 10,138 output tokens
   (`stop_reason: tool_use`).
3. **Enum gap.** This GA's deliverables use type code `DEM` (Demonstrator,
   pilot, prototype, plan designs), not in the `type` enum (only
   `R/DEC/DMP/ETHICS/OTHER/tbd` had been observed). **Fix:** expanded to the
   full official Horizon Europe/Euratom deliverable-type list — `R, DEM, DEC,
   OTHER, ETHICS, ORDP, DMP, SECU, tbd` — in both `llm/schemas/gantt.schema.json`
   and its Zod mirror on the backend branch.

After all three fixes: all three calls succeeded, 0 schema validation errors,
and the backend's `DocumentGenerationService` rendered all three real output
files (including correctly banded 3-year coloring on the Gantt Overview
sheet — the first test to exercise more than 2 years). Raw outputs saved in
[`llm/examples/live-run-2026-09-28-ga2/`](examples/live-run-2026-09-28-ga2/).

**Lesson, again:** one real GA is not enough to validate limits, budgets or
enums — each new real document has so far surfaced at least one genuine gap
that schema-valid output on the first sample didn't catch.

## Gantt Overview rendering fixes — 2026-09-30 (against the same VIGILANCE test)

A real VILABS-produced reference workbook for VIGILANCE surfaced two more
issues — both rendering bugs on the *backend* branch, not extraction bugs
(the underlying JSON was already correct in both cases):

1. **Milestone same-month collision.** WP1's `milestoneIds` correctly
   included both MS1 and MS2, but they share `dueMonth: 6`. The renderer's
   `Map<month, id>` let MS2 silently overwrite MS1, so MS1 never appeared
   anywhere on the sheet. Fixed on the backend side (collect an array per
   month, join as `"MS1 & MS2"`, matching the reference's own convention).
2. **Wrong deliverable-to-task placement.** The backend's Gantt renderer had
   been distributing a WP's deliverables round-robin across its task rows —
   this happened to match the first sample GA by coincidence, but is not a
   real rule, and placed several VIGILANCE deliverables on the wrong task
   row entirely (`dueMonth` itself was always correct in the JSON).

   Fixed here, in the schema: added optional `deliverables[].taskId`
   (`llm/schemas/gantt.schema.json`), with confidence-gated guidance in
   `GANTT_SYSTEM` — set it only when a task's own description text names the
   deliverable it produces (e.g. T1.4's description literally states "the
   task will produce the project's DMP as a deliverable", matching D1.2/
   D1.3) or the deliverable's title unambiguously matches one task's theme
   in that WP; omit rather than guess otherwise. A wrong `taskId` would
   misrepresent real project data; an absent one just falls back to a safe
   default (the WP's own row) on the render side.

   Re-ran only the gantt call: **5 of 50** deliverables got a confident
   `taskId`, all verified correct against the reference (e.g. D1.2/D1.3 ->
   T1.4, D1.7/D1.8/D1.9 -> T1.5). The rest correctly stayed unset — the model
   did not force a guess just to fill the field. 0 schema validation errors.
   Updated `llm/examples/live-run-2026-09-28-ga2/gantt.output.json` to this
   version.

**Lesson, again (n=2 now):** even fields that validate and look
schema-complete can still encode a *wrong* relationship if the renderer
consuming them makes an undocumented assumption (here: "deliverables belong
to tasks in round-robin order") that was never actually part of the schema
contract. Comparing rendered output against a real reference file — not just
running `jsonschema.validate()` — is what caught both of these.
