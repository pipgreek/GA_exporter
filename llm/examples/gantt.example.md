# Worked example — Gantt extraction

Source: `docs/Παραδείγματα/Grant Agreement - GAP-101158152 (1) (1) (2).pdf`
(EVOLVE2CARE, GA 101158152), same conventions as `info.example.md`.

## Input (`{{grant_agreement_markdown}}`)

```markdown
## DATA SHEET
### 1. General data
Project starting date: fixed date: 1 October 2024
Project duration: 24 months

### 4.2 Periodic reporting and payments
| RP No | Month from | Month to |
|---|---|---|
| 1 | 1 | 12 |
| 2 | 13 | 24 |

## ANNEX 1 — DESCRIPTION OF THE ACTION
### List of work packages
| WP No | WP name | Lead Beneficiary | Effort (PM) | Start | End |
|---|---|---|---|---|---|
| WP1 | EVOLVE2CARE experimentation space framework | AUTH | 24.50 | 1 | 24 |
| WP2 | Matching AccelUP Experimentation Space and Services with Innovators and Researchers | AUTH | 66.50 | 2 | 24 |

### Work package WP1
T1.1. Drivers and Barriers for the development of innovations [M1-M4, M19-M24] | Leader: Sploro

### Work package WP2
T2.1. EVOLVE2CARE Experimentation Space infrastructure [M7-M24] Leader: AUTH
T2.2. LLs, Innovators and Researchers Scouting and selection [M2-M12] Leader: Sploro
T2.3. Training Program for Living Labs [M4-M14] Leader: ENOLL
T2.4 Training Program for Innovators and Researchers [M4-M14] Leader: AV

### List of deliverables
| Del No | Title | WP | Lead Beneficiary | Type | Dissemination Level | Due Date (month) |
|---|---|---|---|---|---|---|
| D1.1 | Roadmap on navigating the complexities of enabling innovative technologies in transitional care | WP1 | SPLORO | R | PU | 4 |
| D1.2 | Stakeholder Needs Analysis and KPI framework | WP1 | AUTH | R | PU | 6 |
| D1.3 | EVOVLE2CARE Action Plan | WP1 | AUTH | R | PU | 9 |
| D1.4 | Roadmap ... - Final | WP1 | SPLORO | R | PU | 24 |
| D1.5 | Stakeholder Needs Analysis and KPI framework - Final | WP1 | AUTH | R | PU | 19 |
| D1.6 | EVOVLE2CARE Action Plan - Final | WP1 | AUTH | R | PU | 19 |
| D2.1 | AccelUP Experimentation Space infrastructure | WP2 | AUTH | OTHER | PU | 12 |
| D2.2 | LLs, Innovators and Researchers Scouting and selection Report | WP2 | SPLORO | R | PU | 12 |
| D2.3 | Training Program for Living Labs | WP2 | ENoLL IVZW | OTHER | PU | 14 |
| D2.4 | Training Program for Innovators/Researchers | WP2 | AV | OTHER | PU | 14 |
| D2.5 | AccelUP Experimentation Space infrastructure - Final | WP2 | AUTH | OTHER | PU | 24 |

### List of milestones
| Milestone No | Milestone Name | Work Package No | Lead Beneficiary | Means of Verification | Due Date (month) |
|---|---|---|---|---|---|
| 1 | Holistic ACCELUP architectural blueprints, functional specifications, and integration roadmap available (first version) | WP1 | AUTH | D1.3(v1) | 9 |
| 2 | AccelUP platform up and running to onboard Living Labs | WP2 | AUTH | D2.1(v1) | 12 |
| 3 | Innovators and LLs onboarded on the AccelUP | WP2 | SPLORO | D2.2 | 12 |
```

## Expected output (arguments to `generate_gantt_json`)

```json
{
  "projectAcronym": "EVOLVE2CARE",
  "projectStartDate": "2024-10-01",
  "totalMonths": 24,
  "reportingPeriods": [
    { "id": "RP1", "monthFrom": 1, "monthTo": 12 },
    { "id": "RP2", "monthFrom": 13, "monthTo": 24 }
  ],
  "workPackages": [
    {
      "id": "WP1", "name": "EVOLVE2CARE experimentation space framework",
      "lead": "AUTH", "monthFrom": 1, "monthTo": 24,
      "milestoneIds": ["MS1"],
      "tasks": [
        { "id": "T1.1", "name": "Drivers and Barriers for the development of innovations", "phases": [{ "monthFrom": 1, "monthTo": 4 }, { "monthFrom": 19, "monthTo": 24 }] }
      ]
    },
    {
      "id": "WP2", "name": "Matching AccelUP Experimentation Space and Services with Innovators and Researchers",
      "lead": "AUTH", "monthFrom": 2, "monthTo": 24,
      "milestoneIds": ["MS2", "MS3"],
      "tasks": [
        { "id": "T2.1", "name": "EVOLVE2CARE Experimentation Space infrastructure", "phases": [{ "monthFrom": 7, "monthTo": 24 }] },
        { "id": "T2.2", "name": "LLs, Innovators and Researchers Scouting and selection", "phases": [{ "monthFrom": 2, "monthTo": 12 }] },
        { "id": "T2.3", "name": "Training Program for Living Labs", "phases": [{ "monthFrom": 4, "monthTo": 14 }] },
        { "id": "T2.4", "name": "Training Program for Innovators and Researchers", "phases": [{ "monthFrom": 4, "monthTo": 14 }] }
      ]
    }
  ],
  "deliverables": [
    { "id": "D1.1", "title": "Roadmap on navigating the complexities of enabling innovative technologies in transitional care", "wp": "WP1", "leadBeneficiary": "SPLORO", "type": "R", "disseminationLevel": "PU", "dueMonth": 4 },
    { "id": "D1.2", "title": "Stakeholder Needs Analysis and KPI framework", "wp": "WP1", "leadBeneficiary": "AUTH", "type": "R", "disseminationLevel": "PU", "dueMonth": 6 },
    { "id": "D1.3", "title": "EVOVLE2CARE Action Plan", "wp": "WP1", "leadBeneficiary": "AUTH", "type": "R", "disseminationLevel": "PU", "dueMonth": 9 },
    { "id": "D1.4", "title": "Roadmap ... - Final", "wp": "WP1", "leadBeneficiary": "SPLORO", "type": "R", "disseminationLevel": "PU", "dueMonth": 24 },
    { "id": "D1.5", "title": "Stakeholder Needs Analysis and KPI framework - Final", "wp": "WP1", "leadBeneficiary": "AUTH", "type": "R", "disseminationLevel": "PU", "dueMonth": 19 },
    { "id": "D1.6", "title": "EVOVLE2CARE Action Plan - Final", "wp": "WP1", "leadBeneficiary": "AUTH", "type": "R", "disseminationLevel": "PU", "dueMonth": 19 },
    { "id": "D2.1", "title": "AccelUP Experimentation Space infrastructure", "wp": "WP2", "leadBeneficiary": "AUTH", "type": "OTHER", "disseminationLevel": "PU", "dueMonth": 12 },
    { "id": "D2.2", "title": "LLs, Innovators and Researchers Scouting and selection Report", "wp": "WP2", "leadBeneficiary": "SPLORO", "type": "R", "disseminationLevel": "PU", "dueMonth": 12 },
    { "id": "D2.3", "title": "Training Program for Living Labs", "wp": "WP2", "leadBeneficiary": "ENoLL IVZW", "type": "OTHER", "disseminationLevel": "PU", "dueMonth": 14 },
    { "id": "D2.4", "title": "Training Program for Innovators/Researchers", "wp": "WP2", "leadBeneficiary": "AV", "type": "OTHER", "disseminationLevel": "PU", "dueMonth": 14 },
    { "id": "D2.5", "title": "AccelUP Experimentation Space infrastructure - Final", "wp": "WP2", "leadBeneficiary": "AUTH", "type": "OTHER", "disseminationLevel": "PU", "dueMonth": 24 }
  ],
  "milestones": [
    { "id": "MS1", "name": "Holistic ACCELUP architectural blueprints, functional specifications, and integration roadmap available (first version)", "wp": "WP1", "leadBeneficiary": "AUTH", "meansOfVerification": "D1.3(v1)", "dueMonth": 9 },
    { "id": "MS2", "name": "AccelUP platform up and running to onboard Living Labs", "wp": "WP2", "leadBeneficiary": "AUTH", "meansOfVerification": "D2.1(v1)", "dueMonth": 12 },
    { "id": "MS3", "name": "Innovators and LLs onboarded on the AccelUP", "wp": "WP2", "leadBeneficiary": "SPLORO", "meansOfVerification": "D2.2", "dueMonth": 12 }
  ]
}
```

## Notes / known gap this example exposes

- **T1.1 in the real GA has a non-contiguous month range** ("Drivers and Barriers...
  [M1-M4, M19-M24]" — two separate phases with a gap). Resolved: `gantt.schema.json`
  now gives every task a `phases[]` array (≥1 entries) instead of a single
  `monthFrom`/`monthTo` pair, so T1.1 is represented as two phases and the render engine
  draws two separate bar segments rather than one bar spanning the gap it isn't active in.
- Milestone IDs in the source table are bare numbers (`1`, `2`, `3`); the prompt/schema
  expect the `MS`-prefixed form (`MS1`) to match how they're referenced elsewhere in the
  GA (e.g. `WP1`'s row, `meansOfVerification: "D1.3(v1)"`) and in the Gantt template's own
  `M1-M24 Overview` sheet (`J5: 'MS1'`) — this normalization must be explicit in the prompt
  (it already is, implicitly, via "Copy IDs ... verbatim as they appear" combined with the
  schema's `pattern: "^MS[0-9]+$"`; worth double-checking this actually works once tested
  live).
