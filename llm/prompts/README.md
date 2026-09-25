# LLM Request Packages — GA Exporter

Each `<name>.request.json` is the **complete, ready-to-send** Anthropic Messages API
call for one of the three `generate<Name>Json()` backend service functions
(implementation-plan.md §5.D). It bundles everything task A (schemas), B (prompts)
and C (tool-use translation) were meant to produce, so the backend does not need to
assemble anything except the Grant Agreement markdown itself.

## Files

| File | Backend function | Produces |
|---|---|---|
| [`info.request.json`](info.request.json) | `generateInfoJson()` | data for the INFO Word doc |
| [`gantt.request.json`](gantt.request.json) | `generateGanttJson()` | data for the Gantt Excel |
| [`kpi.request.json`](kpi.request.json) | `generateKpiJson()` | data for the KPI Excel |

Each file has this shape:

```jsonc
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 8192,
  "system": "...",                 // full system prompt, incl. the "tbd" rule
  "tools": [{ "name": "...", "description": "...", "input_schema": {...} }],
  "tool_choice": { "type": "tool", "name": "..." },  // forces a structured tool call
  "user_message": { "role": "user", "content": "Grant Agreement (parsed to Markdown):\n\n{{grant_agreement_markdown}}" }
}
```

`input_schema` is `llm/schemas/<name>.schema.json` with `$schema`/`$id` stripped
(Anthropic's tool `input_schema` is a JSON Schema subset and doesn't use those keys).
If the schemas are edited, re-run
`llm/prompts/build_requests.py`-equivalent regeneration (see "Keeping in sync" below)
rather than hand-editing the `.request.json` files, so schema and prompt never drift
apart.

## How the backend uses one of these (per implementation-plan.md §5.D)

```ts
const pkg = require('./llm/prompts/info.request.json');

const userMessage = {
  ...pkg.user_message,
  content: pkg.user_message.content.replace(
    '{{grant_agreement_markdown}}',
    parsedGrantAgreementMarkdown // from the pdfplumber/Unstructured step
  ),
};

const response = await anthropic.messages.create({
  model: pkg.model,
  max_tokens: pkg.max_tokens,
  system: pkg.system,
  tools: pkg.tools,
  tool_choice: pkg.tool_choice,
  messages: [userMessage],
});

const toolUse = response.content.find(b => b.type === 'tool_use');
const rawJson = toolUse.input; // matches llm/schemas/<name>.schema.json
const validated = InfoSchema.parse(rawJson); // Zod validation, per §5.E
```

Run all three (`info`, `gantt`, `kpi`) in parallel per action pipeline (implementation-plan.md §2).

## The "tbd" contract

Every field the LLM cannot find in the Grant Agreement text comes back as the
literal string `"tbd"` (or an empty array for list fields) — this is enforced by an
explicit rule in every `system` prompt, **not** by the schema's `"default"` keys
(those are documentation only; Anthropic does not auto-apply JSON Schema defaults).
Downstream (frontend preview, docxtemplater/exceljs fill) must treat `"tbd"` as
"needs human input", e.g. highlight it visually rather than rendering it as if it
were real data.

## Retry policy (implementation-plan.md §5.D)

Because unknown values are valid `"tbd"` strings, a Zod validation failure after
calling one of these means a genuine schema violation (wrong type, bad id pattern,
invalid enum, truncated response) — not "the GA didn't mention X". The backend's
1-2 retries should re-send the *same* request package unchanged; if it still fails,
surface the error rather than retrying indefinitely.

## Not covered yet / open follow-ups

- Not tested end-to-end against a real parsed Grant Agreement (implementation-plan.md
  §5.B: "Test prompts πάνω στο δείγμα Grant Agreement (GAP-101158152)"). Needs a live
  API key and the backend's actual PDF→Markdown output to validate quality.
- `max_tokens: 8192` is a starting guess — the EVOLVE2CARE sample GA has 6 WPs / 27
  deliverables/milestones combined; a larger consortium could need more. Revisit once
  tested against a few real GAs of different sizes.
- See `llm/schemas/README.md` "Open points" for schema-level items (max months/WPs,
  enum coverage, KPI grouping shape, frontend preview mapping) that also affect these
  prompts once resolved.
