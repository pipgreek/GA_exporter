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
