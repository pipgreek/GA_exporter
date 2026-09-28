# Worked example — INFO extraction

Source: `docs/Παραδείγματα/Grant Agreement - GAP-101158152 (1) (1) (2).pdf`
(EVOLVE2CARE, GA 101158152). The input below is a **trimmed markdown excerpt**
approximating what the backend's PDF→Markdown parsing step (pdfplumber/
Unstructured) would hand to the LLM — real text pulled from the actual GA, not
invented, but not the full 59-page document.

## Input (`{{grant_agreement_markdown}}`)

```markdown
# GRANT AGREEMENT
Project 101158152 — EVOLVE2CARE

## PREAMBLE
This Agreement is between:
1. 'the coordinator': ARISTOTELIO PANEPISTIMIO THESSALONIKIS (AUTH), PIC 999895692,
   established in KEDEA BUILDING, TRITIS SEPTEMVRIOU, THESSALONIKI 546 36, Greece,
2. EUROPEAN NETWORK OF LIVING LABS IVZW (ENoLL IVZW), PIC 984556306, Belgium,
3. ANTHOLOGY VENTURES JSC (AV), PIC 895312523, Bulgaria,
4. SPLOROTECH SL (SPLORO), PIC 890190147, Spain,
5. VILABS (CY) LTD (VILABS), PIC 917943205, established in VICTORY HOUSE 205
   ARCHBISHOP MAKARIOS, LIMASSOL 3030, Cyprus,

## DATA SHEET
### 1. General data
Project name: Engaging the Value Of Living Labs to Innovate Care And Regulatory Environments
Project acronym: EVOLVE2CARE
Call: HORIZON-EIE-2023-CONNECT-02
Topic: HORIZON-EIE-2023-CONNECT-02-01
Type of action: HORIZON Coordination and Support Actions
Project starting date: fixed date: 1 October 2024
Project end date: 30 September 2026
Project duration: 24 months

### 2. Participants
| N° | Role | Short name | Legal name | Ctry | PIC | Max grant amount |
|---|---|---|---|---|---|---|
| 1 | COO | AUTH | ARISTOTELIO PANEPISTIMIO THESSALONIKIS | EL | 999895692 | 229 562.50 |
| 2 | BEN | ENoLL IVZW | EUROPEAN NETWORK OF LIVING LABS IVZW | BE | 984556306 | 214 500.00 |
| 3 | BEN | AV | ANTHOLOGY VENTURES JSC | BG | 895312523 | 228 730.14 |
| 4 | BEN | SPLORO | SPLOROTECH SL | ES | 890190147 | 180 312.50 |
| 5 | BEN | VILABS | VILABS (CY) LTD | CY | 917943205 | 134 125.00 |

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
| WP3 | Set Up of AccelUP experimentation Space and Services Execution, Lessons Learnt and Best practices | AV | 54.50 | 12 | 24 |
| WP4 | EVOLVE2CARE's People-Centric Experimentation Ecosystem Outreach, Sustainability and Clustering | VILABS | 90.80 | 1 | 24 |
| WP5 | Project Coordination and Management | AUTH | 25.60 | 1 | 24 |
| WP6 | Ethics requirements | AUTH | 0.00 | 1 | 24 |

### Work package WP4 — EVOLVE2CARE's People-Centric Experimentation Ecosystem Outreach, Sustainability and Clustering
Lead Beneficiary: VILABS. Start Month 1, End Month 24.

T4.1. EVOLVE2CARE Dissemination, Communication and Outreach for the Open Calls [M1-M24] Leader: VILABS
T4.2. Exploitation and IPR of AccelUP [M1-M24] Task leader: VILABS
T4.3. Clustering with EIT KICs [M12-M24] Leader: ENOLL

### 3.2.1.1 Coordinator
Dr. Evdokimos Konstantinidis has over 15 years of work experience... [coordinator bio for AUTH,
no VILABS personnel named anywhere in this Grant Agreement]
```

## Expected output (arguments to `generate_info_json`)

```json
{
  "gaNumber": "101158152",
  "projectAcronym": "EVOLVE2CARE",
  "projectName": "Engaging the Value Of Living Labs to Innovate Care And Regulatory Environments",
  "coordinator": {
    "shortName": "AUTH",
    "legalName": "ARISTOTELIO PANEPISTIMIO THESSALONIKIS",
    "country": "EL"
  },
  "ownEntity": {
    "shortName": "VILABS",
    "legalName": "VILABS (CY) LTD",
    "pic": "917943205",
    "role": "BEN",
    "country": "CY"
  },
  "callTopic": "HORIZON-EIE-2023-CONNECT-02 / HORIZON-EIE-2023-CONNECT-02-01",
  "typeOfAction": "HORIZON Coordination and Support Actions",
  "projectSummary": "tbd",
  "duration": {
    "startDate": "2024-10-01",
    "endDate": "2026-09-30",
    "totalMonths": 24
  },
  "reportingPeriods": [
    { "id": "RP1", "monthFrom": 1, "monthTo": 12 },
    { "id": "RP2", "monthFrom": 13, "monthTo": 24 }
  ],
  "website": "tbd",
  "socialMedia": { "facebook": "tbd", "linkedin": "tbd", "youtube": "tbd" },
  "repository": "tbd",
  "mailingLists": "tbd",
  "ownEffortSummary": "VILABS leads WP4 and contributes tasks T4.1 and T4.2, with ENoLL leading T4.3 within the same WP.",
  "workPackages": [
    {
      "id": "WP1", "name": "EVOLVE2CARE experimentation space framework",
      "leadBeneficiary": "AUTH", "monthFrom": 1, "monthTo": 24, "personMonths": 24.50,
      "tasks": []
    },
    {
      "id": "WP2", "name": "Matching AccelUP Experimentation Space and Services with Innovators and Researchers",
      "leadBeneficiary": "AUTH", "monthFrom": 2, "monthTo": 24, "personMonths": 66.50,
      "tasks": []
    },
    {
      "id": "WP3", "name": "Set Up of AccelUP experimentation Space and Services Execution, Lessons Learnt and Best practices",
      "leadBeneficiary": "AV", "monthFrom": 12, "monthTo": 24, "personMonths": 54.50,
      "tasks": []
    },
    {
      "id": "WP4", "name": "EVOLVE2CARE's People-Centric Experimentation Ecosystem Outreach, Sustainability and Clustering",
      "leadBeneficiary": "VILABS", "monthFrom": 1, "monthTo": 24, "personMonths": 90.80,
      "tasks": [
        { "id": "T4.1", "name": "EVOLVE2CARE Dissemination, Communication and Outreach for the Open Calls", "leader": "VILABS", "monthFrom": 1, "monthTo": 24 },
        { "id": "T4.2", "name": "Exploitation and IPR of AccelUP", "leader": "VILABS", "monthFrom": 1, "monthTo": 24 },
        { "id": "T4.3", "name": "Clustering with EIT KICs", "leader": "ENOLL", "monthFrom": 12, "monthTo": 24 }
      ]
    },
    {
      "id": "WP5", "name": "Project Coordination and Management",
      "leadBeneficiary": "AUTH", "monthFrom": 1, "monthTo": 24, "personMonths": 25.60,
      "tasks": []
    },
    {
      "id": "WP6", "name": "Ethics requirements",
      "leadBeneficiary": "AUTH", "monthFrom": 1, "monthTo": 24, "personMonths": 0,
      "tasks": []
    }
  ],
  "roles": []
}
```

## Why this example is worth keeping

- **`roles: []` is the correct answer here, not an extraction failure.** A human-curated
  document exists elsewhere (`docs/Παραδείγματα/evolve2care info tab (2).pdf`) that names
  VILABS' Project Manager, Financial Manager, etc. — but those names never appear in the
  Grant Agreement PDF itself (only the coordinator's bio is named, in Annex 1 Part B
  §3.2.1.1). An LLM extracting strictly from the GA text must return an empty array, not
  reach for that outside knowledge. This is the exact failure mode the "no invention" rule
  in the system prompt exists to prevent.
- `website` / `socialMedia` / `repository` / `mailingLists` are `"tbd"` for the same reason:
  they are real, correct values in the info-tab sample, but absent from the GA text.
- `projectSummary` is `"tbd"` in this excerpt only because the Data Sheet's actual summary
  paragraph was trimmed out of the excerpt above for brevity — in the full GA it is present
  and should be extracted.
- Tasks are only spelled out for WP4 (ownEntity's own WP) in the excerpt to keep this
  example short; a real run over the full Annex 1 Part A would populate every WP's `tasks`
  the same way.
