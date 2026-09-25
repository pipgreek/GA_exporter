# Worked examples — GA Exporter

One `.md` per output type, each pairing a real (trimmed) markdown excerpt of the
EVOLVE2CARE Grant Agreement (`docs/Παραδείγματα/Grant Agreement - GAP-101158152...pdf`)
with the JSON that `generate<Name>Json()` should return for it, per
`llm/prompts/<name>.request.json`.

- [`info.example.md`](info.example.md)
- [`gantt.example.md`](gantt.example.md)
- [`kpi.example.md`](kpi.example.md)

All three "Expected output" JSON blocks are validated to pass their schema
(`llm/schemas/<name>.schema.json`) — see each file's trailing "Notes / known gap"
section for what the example exposes as still-open (non-contiguous task month
ranges, milestone-id normalization, category-naming stability, etc.).

## What these are, and are not

These are **hand-built reference pairs**, not the actual output of a Claude API
call — no live model has been run against them yet (see `llm/prompts/README.md`
"Not covered yet"). They exist to:

1. Give a concrete, checkable target for whoever first wires up
   `generate<Name>Json()` against the live Anthropic API.
2. Document real edge cases found while reading the actual GA (e.g. task T1.1's
   split `[M1-M4, M19-M24]` range, bare milestone numbers vs. the `MS`-prefixed id
   form) that a schema/prompt written from the "happy path" alone would miss.
3. Double as a regression fixture once real API testing starts: if a prompt change
   makes the model stop extracting `ownEntity` from participant PIC 917943205
   correctly, these examples say what "correct" looked like before the change.

## Regenerating / re-validating

The "Expected output" blocks are checked against the schemas with a small script
(not checked in, run ad hoc):

```python
import json, re, jsonschema
text = open("llm/examples/info.example.md", encoding="utf-8").read()
output = json.loads(re.search(r"## Expected output.*?```json\n(.*?)\n```", text, re.S).group(1))
jsonschema.validate(output, json.load(open("llm/schemas/info.schema.json")))
```
