# Worked example — KPI extraction

Source: `docs/Παραδείγματα/Grant Agreement - GAP-101158152 (1) (1) (2).pdf`
(EVOLVE2CARE, GA 101158152), same conventions as `info.example.md`. This one
combines two different source shapes on purpose: narrative "Scale:" bullet points
under an Expected Outcome block, and a dedicated Communication/Dissemination
Indicators table — to show the LLM handles both.

## Input (`{{grant_agreement_markdown}}`)

```markdown
## DATA SHEET
### 1. General data
Project starting date: fixed date: 1 October 2024
Project duration: 24 months

## ANNEX 1 PART B — IMPACT
### 2.1.1 How the project results are expected to make a difference in terms of impact

EXPECTED OUTCOME #1
Increase knowledge on experimentation frameworks for testing innovations

Target group: Innovators/researchers, RTOs, regulators, SMEs, startups, standardisation specialists

Scale: 10 Reports on experimentation findings including regulatory barriers; 10 innovators
benefited from the experimentation services; 2 Tailored Training Programs including workshops
and webinars (1 for LLs and 1 for Innovators); 30 LLs and 18 innovators benefited from the
trainings.

### 2.2.1 Dissemination, communication, and exploitation activities

Table 5 Communication and Dissemination Indicators

| TOOL | Indicator(s) | values |
|---|---|---|
| Social Media | LinkedIn followers | +600 |
| Social Media | X followers | +600 |
| Social Media | FB followers | +350 |
| Social Media | YouTube followers | +150 |
| Social Media | Impressions (monthly) | +3000 |
| Website | Monthly unique visitors | +500 |
| Website | Monthly recurrent visitors | +600 |
| Website | Monthly pageviews | +1000 |
```

## Expected output (arguments to `generate_kpi_json`)

```json
{
  "projectAcronym": "EVOLVE2CARE",
  "projectStartDate": "2024-10-01",
  "totalMonths": 24,
  "categories": [
    {
      "name": "EXPECTED OUTCOME #1",
      "groups": [
        {
          "kpis": [
            { "label": "Reports on experimentation findings including regulatory barriers", "target": "10", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "Innovators benefited from the experimentation services", "target": "10", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "Tailored Training Programs (1 for LLs and 1 for Innovators)", "target": "2", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "LLs and innovators benefited from the trainings", "target": "30 LLs and 18 innovators", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }
          ]
        }
      ]
    },
    {
      "name": "Social Media",
      "groups": [
        {
          "kpis": [
            { "label": "LinkedIn followers", "target": "+600", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "X followers", "target": "+600", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "FB followers", "target": "+350", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "YouTube followers", "target": "+150", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "Impressions (monthly)", "target": "+3000", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }
          ]
        }
      ]
    },
    {
      "name": "Website",
      "groups": [
        {
          "kpis": [
            { "label": "Monthly unique visitors", "target": "+500", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "Monthly recurrent visitors", "target": "+600", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
            { "label": "Monthly pageviews", "target": "+1000", "achieved": 0, "monthlyValues": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }
          ]
        }
      ]
    }
  ]
}
```

## Notes / known gap this example exposes

- No `code` (`[Cx]`/`[Dx]`) is present in either source shape shown here — the real
  EVOLVE2CARE GA doesn't use bracket codes for indicators at all (that convention was
  observed in the *VIGILANCE* live KPI workbook, a different project). `code` is
  correctly omitted on every KPI above. Confirms `code` must stay optional in the schema.
- `EXPECTED OUTCOME #1`'s four scale bullets are **one comma/semicolon-separated
  sentence** in the source text, not a table — the LLM has to split it into four
  separate KPI rows itself. This is exactly the kind of judgment call worth checking
  once this is run against the live API (does the model split it the same way twice in
  a row? does it split on the right boundaries for a differently-punctuated GA?).
- **Category naming is now the GA's own heading, copied verbatim** (`"EXPECTED OUTCOME #1"`,
  not a paraphrased `"Expected Outcome #1 — Increase knowledge on..."`) — this is required
  so re-running extraction on the same GA produces identical category names across runs.
- **`groups[]` is the nesting level for bracket-coded sub-headings** (e.g. a hypothetical
  `"[C6.1]Twitter"` sub-section under a "Social Media" category, as seen in the *VIGILANCE*
  workbook). None of the three categories here have that kind of internal sub-heading, so
  each has exactly one group with no `label` — the flat list of kpis is still reachable at
  `categories[].groups[0].kpis[]`, just always through a group wrapper for structural
  consistency with categories that *do* have real sub-headings.
