# GA Exporter — Implementation Plan

## 1. Σύνοψη εφαρμογής

Web εργαλείο που παίρνει ένα **Grant Agreement PDF**, το αναλύει (parsing + LLM), και παράγει αυτόματα **3 αρχεία**:

1. **INFO document** (Word) — γενικά στοιχεία project, WPs, roles
2. **Gantt Chart** (Excel) — χρονοδιάγραμμα WPs/Tasks/Deliverables/Milestones
3. **KPI Monitoring** (Excel) — δείκτες παρακολούθησης ανά κατηγορία/μήνα

Ο χρήστης ανεβάζει το PDF και, μόλις ολοκληρωθεί η επεξεργασία, βλέπει κατευθείαν τα 3 αρχεία για download (μεμονωμένα ή σε .zip), με **προαιρετικό** read-only preview για το καθένα. **Χωρίς inline editing, χωρίς login/ιστορικό, χωρίς database.**

## 2. Αρχιτεκτονική ροή

```
Upload PDF
   → parsing (pdfplumber/Unstructured.io, χωρίς LLM) → .md
   → 3 παράλληλα LLM calls (Claude Haiku, tool-use/structured output)
        κάθε ένα: prompt + JSON schema συγκεκριμένο ανά τύπο αρχείου
   → validation (Zod/Pydantic) στο κάθε JSON
   → validated JSON γεμίζει προκαθορισμένο template
        (docxtemplater για Word, exceljs για Excel)
   → ίδιο JSON τροφοδοτεί το frontend preview (μία πηγή αλήθειας)
   → Κάρτες αρχείων στην αρχική σελίδα (χωρίς Confirm, χωρίς ξεχωριστή σελίδα):
        Download (μεμονωμένα ή .zip) + προαιρετικό Preview (read-only, modal 90%)
```

Καμία μόνιμη αποθήκευση: Redis (ephemeral status, TTL) + Supabase Storage (προσωρινά αρχεία, cleanup job).

## 3. Τεχνολογική στοίβα (όλα open-source/δωρεάν)

| Επίπεδο | Τεχνολογία |
|---|---|
| Frontend framework | Next.js + React + TypeScript |
| Styling | Tailwind CSS |
| Upload | react-dropzone |
| Word preview | mammoth.js (docx→HTML) + DOMPurify |
| Excel preview | `<table>` (read-only), μία καρτέλα ανά sheet |
| Modal | @radix-ui/react-dialog ή @headlessui/react |
| Backend framework | Node.js/TypeScript (NestJS) |
| Queue | BullMQ (open source) + Redis |
| PDF parsing | pdfplumber ή Unstructured.io |
| Word generation | docxtemplater (template-filling) |
| Excel generation | exceljs (template-filling) |
| .zip | archiver / zipfile |
| Validation | Zod (Node) |
| LLM | Anthropic API — Claude Haiku (structured output/tool use) |
| Queue hosting | Upstash Redis — free tier |
| File storage | Supabase Storage — free tier |
| Backend hosting | Render.com — free tier |
| Frontend hosting | Vercel — free tier |

## 4. Branches & Ομάδα

| Branch | Άτομα | Αντικείμενο |
|---|---|---|
| `backend` (πρώην `backend-db-mcp`) | pipgreek, Γιώργος | Backend API, queue/worker, PDF parsing, template engine, templates, hosting/infra |
| `frontend` | Θεοδώρα | Next.js UI, upload/preview/download flow |
| `llm` | Αριστείδης | Prompts + JSON schemas ανά τύπο αρχείου (.md files) |

Ροή: κάθε branch δουλεύει ανεξάρτητα → PR προς `main` όταν έτοιμο → review → merge.

---

## 5. Tasks ανά άτομο

### 🔧 pipgreek + Γιώργος — branch `backend`

#### A. Infra & setup
- [x] NestJS project scaffold (`backend/`)
- [x] Σύνδεση Upstash Redis (queue) — πραγματικό free-tier instance, δοκιμασμένο 2026-09-30
- [x] Σύνδεση Supabase Storage (file storage) — πραγματικό project + private bucket `ga-exporter`, δοκιμασμένο 2026-09-30
- [ ] Deploy pipeline σε Render.com (free tier)
- [x] Env vars / secrets management (`backend/.env`, Anthropic API key + Supabase + Redis credentials)

**Κατάσταση 2026-09-30:** πλήρες end-to-end test με πραγματικό infra (όχι πια fakes) — HTTP upload → πραγματικό BullMQ/Upstash queue → worker → πραγματικό Supabase Storage → `/status`, `/preview`, `/download`, `/download-all` endpoints, όλα με πραγματικά αρχεία. Βρέθηκε και διορθώθηκε ένα ακόμη πραγματικό bug: το `ioredis` δεν ήταν δηλωμένο dependency (BullMQ το φορτώνει δυναμικά) — δούλευε σε όλα τα προηγούμενα tests μόνο επειδή χρησιμοποιούσαν fake queue, ποτέ πραγματικό Redis. Test data καθαρίστηκε μετά.

#### B. Upload & queue
- [x] `POST /upload` — δέχεται PDF (multipart/form-data), ελέγχει το PDF signature, αποθήκευση στο Supabase Storage, δημιουργία `requestId`, βάζει job στην ουρά (BullMQ)
- [ ] Worker process — καταναλώνει jobs από την ουρά, εκτελεί το pipeline, ενημερώνει status στο Redis σε κάθε βήμα
- [x] `GET /status/{requestId}` — επιστρέφει `{ status, progress, message }`

#### C. PDF → Markdown
- [x] Ενσωμάτωση pdfplumber (`extract_to_markdown.py` + `pdf-parser.service.ts`)
- [x] Εξαγωγή κειμένου + πινάκων σε δομημένο `.md`
- [x] Test με το δείγμα PDF (Grant Agreement GAP-101158152) — βλ. `docs/Παραδείγματα/Grant Agreement - GAP-101158152.md`

> **Κατάσταση 2026-09-28:** ο worker (`pdf-processing.processor.ts`) τρέχει πλέον μέχρι και το LLM extraction (§D/§E) — στέκεται πριν το document generation (§F/§G). Βλ. ενημέρωση παρακάτω.

#### D. LLM integration (χρησιμοποιεί τα schemas/prompts από branch `llm`)
- [x] Anthropic SDK setup, Claude Haiku client (`backend/src/llm/llm.service.ts`)
- [x] 3 service functions: `generateInfoJson()`, `generateGanttJson()`, `generateKpiJson()` — tool-use/structured output calls, καταναλώνουν απευθείας τα `llm/prompts/*.request.json`
- [x] Παράλληλη εκτέλεση των 3 calls (`generateAll()`, `Promise.all`)
- [x] Retry logic σε αποτυχία validation (`LLM_MAX_RETRIES`, default 2)

#### E. Validation
- [x] Zod schemas (`backend/src/llm/schemas/{info,gantt,kpi}.schema.ts`, mirror των `llm/schemas/*.schema.json`)
- [x] Error handling / error state στο status αν αποτύχει μετά τα retries — `LlmValidationError` propagates μέσα από τον υπάρχοντα catch-all του processor, το BullMQ job πάει `failed`, το `GET /status` το βλέπει ως `error`

**Κατάσταση 2026-09-28:** ολοκληρωμένο και δοκιμασμένο — `pnpm build` καθαρό, live run του `generateAll()` πάνω στο πραγματικό GA (~31s, ίδια αποτελέσματα με το `llm/testing-notes.md` live test), και mocked test και για τα δύο retry paths (retry-then-succeed, exhaust-retries-then-throw). Τα 3 validated JSON αποθηκεύονται σε `{requestId}/intermediate/{info,gantt,kpi}.json` στο Supabase Storage, έτοιμα για το document generation step (§G) που ακολουθεί.

> **Ενημέρωση 2026-09-30 (2ο GA test):** ένα μεγαλύτερο πραγματικό GA (VIGILANCE) αποκάλυψε ότι το `max_tokens: 8192` δεν αρκούσε πάντα (το gantt call έκοβε στη μέση, `stop_reason: max_tokens`, λείπε ολόκληρο το `milestones` array). Ανέβηκε σε `16384` και για τα 3 request packages (`llm/prompts/*.request.json`). Βρέθηκε επίσης νέος deliverable `type` κωδικός (`DEM`) που δεν υπήρχε στο enum — επεκτάθηκε στην πλήρη επίσημη λίστα EU Portal. Λεπτομέρειες: `llm/testing-notes.md` §"Second GA test".

#### F. Templates (Word/Excel) — **[owner: Γιώργος, υλοποιήθηκε 2026-09-28]**
- [x] **INFO (Word)**: πραγματικό docxtemplater template (`backend/templates/info-template.docx`), παραγόμενο από script (`backend/scripts/generate-info-template.ts`, τρέχει μία φορά, το binary μπαίνει στο repo). Nested πεδία (`ownEntity`, `duration`, `socialMedia`) γράφονται ως `{#scope}...{/scope}` blocks — **όχι** dot-notation (`{a.b}`), γιατί το docxtemplater δεν το υποστηρίζει by default (βρέθηκε bug σε αρχικό test, διορθώθηκε).
- [x] **Gantt/KPI (Excel)**: **αλλαγή αρχιτεκτονικής απόφασης** — αντί για static template αρχείο με fixed tabs, το workbook χτίζεται προγραμματιστικά (exceljs) με κοινό styling module (`excel-render-utils.ts`: header fill/bold/freeze, auto-width, sheet-name sanitization). Λόγος: το πλήθος στηλών (μήνες) και sheets (KPI categories) είναι **εγγενώς μεταβλητό ανά GA** — το `llm/schemas/preview-mapping.md` το επιβεβαιώνει ρητά ("one sheet per category"). Ένα fixed-tab template δεν θα μπορούσε ποτέ να καλύψει σωστά όλα τα GAs. Τα `docs/templates/*.xlsx` παραδείγματα παραμένουν ως οπτική αναφορά στυλ, όχι ως literal templates.
- [x] Ορισμός μέγιστου εύρους — `backend/src/document-generation/render-limits.ts`: `MAX_TOTAL_MONTHS=48`, `MAX_WORK_PACKAGES=30`, `MAX_KPI_CATEGORIES=40`. Δεν είναι τεχνικός περιορισμός (οι στήλες/sheets είναι δυναμικά) αλλά **sanity guard**: η υπέρβαση θεωρείται πιθανό extraction bug, όχι πραγματικό μεγάλο project, και αποτυγχάνει το job καθαρά (status `error`) αντί να παράγει αλλοιωμένο αρχείο.
- [x] Templates στο `backend/templates/`

#### G. Document generation engine
- [x] `renderInfoDoc(json)` — docxtemplater fill → .docx (`info-renderer.ts`)
- [x] `renderGanttExcel(json)` / `renderKpiExcel(json)` — exceljs, χτίζονται από τα ίδια `gantt-mapping.ts`/`kpi-mapping.ts` που τροφοδοτούν και το preview (μία πηγή αλήθειας, §2)
- [x] `DocumentGenerationService.generateAll()` — τρέχει και τα 3 παράλληλα
- [x] Αποθήκευση παραγόμενων αρχείων στο Supabase Storage (`{requestId}/output/INFO_Generation.docx`, `Gantt_Chart.xlsx`, `KPI_Monitoring.xlsx`, `preview.json` — ίδια ονόματα με το `api-contract.md`)

**Κατάσταση 2026-09-28:** ολοκληρωμένο, δοκιμασμένο. `DocumentGenerationService.generateAll()` δοκιμάστηκε με το πραγματικό validated JSON (openpyxl inspection του .xlsx, έλεγχος του mammoth HTML) — εκεί εντοπίστηκε και διορθώθηκε το docxtemplater dot-notation bug. Πλήρες worker integration test (πραγματικό PDF → πραγματικό pdfplumber parsing → mocked LLM με πραγματικά cached δεδομένα → πραγματικό document generation → fake in-memory storage): επιβεβαιώθηκε η ακριβής σειρά κατάστασης `scanning→extracting→analyzing→generating→done`, ότι `done` εμφανίζεται **μόνο** αφού υπάρχουν και τα 4 αρχεία στο storage, και ότι μια παραβίαση του render-limit αποτυγχάνει το job καθαρά (status `error`, μηδέν partial output files) αντί να δηλώσει ψευδώς `done`.

#### H. Preview & Download endpoints
- [x] `GET /preview/{requestId}` — επιστρέφει το αποθηκευμένο `{requestId}/output/preview.json`, 200 μόνο όταν `done`, 409 αν όχι έτοιμο, 404 αν άγνωστο/ληγμένο
- [x] `GET /download/{requestId}/{fileType}` — direct stream από Supabase Storage, σωστό filename/Content-Type/Content-Disposition ανά `api-contract.md`
- [x] `GET /download-all/{requestId}` — .zip on-the-fly με `archiver` (`GA_Exporter_files.zip`)
- [x] `output-files.ts` — μία πηγή αλήθειας για storage paths/filenames/content-types, χρησιμοποιείται και από τον worker (γράφει) και από τα endpoints (διαβάζουν) ώστε να μην αποσυγχρονιστούν
- [x] CORS: `exposedHeaders: ['Content-Disposition']` στο `main.ts` (χωρίς αυτό το frontend δεν μπορεί να διαβάσει το filename cross-origin)

**Κατάσταση 2026-09-30:** ολοκληρωμένο, δοκιμασμένο — service-level integration test (fake storage + duck-typed fake BullMQ Queue, χωρίς Redis) κάλυψε όλα τα success/error paths (preview 200/409/404, download 200/404/409, download-all zip): 13/13 checks πέρασαν, το zip επαληθεύτηκε περιεχομενικά με Python zipfile. **Με αυτό ολοκληρώνεται όλο το backend pipeline (§5.A-H εκτός infra/ops).**

#### I. Cleanup & ops
- [ ] Cron/job που διαγράφει αρχεία στο Supabase Storage μετά από Χ ώρες
- [ ] Redis TTL σε κάθε status key
- [ ] Βασικό logging/error monitoring

---

### 🎨 Θεοδώρα — branch `frontend`

#### A. Setup
- [x] Next.js project scaffold (`frontend/`)
- [x] Tailwind CSS setup
- [x] Βασικό routing: `/` (το `/result` καταργήθηκε στις 2026-09-25 — όλη η ροή γίνεται στην αρχική, βλ. C/D)

#### B. Home page — upload & progress
- [x] `UploadDropzone` component (react-dropzone, μόνο PDF, disabled μετά το upload)
- [x] Preview μικρογραφίας ανεβασμένου αρχείου + κουμπί διαγραφής (X)
- [x] Κουμπί **Start** (disabled μέχρι upload), `POST /upload` μέσω FormData
- [x] `ProgressIndicator` component — polling `GET /status/{requestId}` (setInterval 2-3s), μηνύματα ανά status, fallback rotation μηνυμάτων, timeout 90s

> **Απόφαση 2026-09-25 (επιλογή B):** χωρίς edit, το βήμα Confirm δεν προσέφερε κάτι. Μόλις ολοκληρωθεί η επεξεργασία, τα 3 αρχεία εμφανίζονται κατευθείαν στην αρχική ως κάρτες με Download και **προαιρετικό** Preview. Η ξεχωριστή σελίδα `/result` και το Confirm καταργήθηκαν.

#### C. Αποτελέσματα & προαιρετικό preview (read-only)
- [x] `FileCard` component (x3, ένα ανά τύπο αρχείου) με κουμπί **Preview**
- [x] `WordViewer` — mammoth HTML (από backend) + DOMPurify.sanitize + dangerouslySetInnerHTML
- [x] `ExcelViewer` — read-only `<table>` από JSON `sheets[]`, μία καρτέλα ανά sheet
- [x] `PreviewModal` (radix-ui dialog) — expand 90%, internal scroll, close (X) επιστρέφει εκεί που ήταν
- [x] Εμφάνιση των αρχείων κατευθείαν μετά το `done` (χωρίς Confirm)· `GET /preview` μόνο όταν ανοίξει preview

#### D. Downloads (στην αρχική, στις κάρτες αρχείων)
- [x] Κουμπί **Download** σε κάθε `FileCard` (όνομα αρχείου + Download)
- [x] Κουμπί **Download all (.zip)**
- [x] Κουμπί **Process another Grant Agreement** (αντικαθιστά το «Return to Home Page» — επαναφέρει την αρχική)

#### E. Error states
- [x] UI για σφάλμα upload (λάθος τύπος αρχείου)
- [x] UI για σφάλμα processing (timeout/αποτυχία LLM μετά τα retries)

#### F. Στοιχεία από το UI/UX mockup (προστέθηκε μετά το αρχικό plan)
- [x] Logo ViLabs → επιστροφή στην αρχική σελίδα (με confirm modal «Return to Home?» όταν υπάρχει ανεβασμένο αρχείο)
- [x] Σελίδα **Privacy Policy** (περιεχόμενο από το mockup `docs/frontend UI UX/index.html`)
- [x] Link «Privacy Policy» στο footer (με confirm modal όταν υπάρχει εργασία σε εξέλιξη)

**Dependency:** χρειάζεται το API contract (§6 παρακάτω) νωρίς για να δουλέψει με mock data πριν είναι έτοιμο το πραγματικό backend.

---

### 🧠 Αριστείδης — branch `llm`

**Κατάσταση 2026-09-28: ολοκληρωμένο, δοκιμασμένο έναντι live API.** Εκκρεμεί μόνο merge `llm` → `main`.

#### A. JSON Schemas (contract με backend, .md/.json αρχεία)
- [x] Schema **INFO** (`llm/schemas/info.schema.json`)
- [x] Schema **Gantt** (`llm/schemas/gantt.schema.json`)
- [x] Schema **KPI** (`llm/schemas/kpi.schema.json`)
- [x] Required/optional fields, τύποι δεδομένων — τεκμηριωμένα στο `llm/schemas/README.md`

#### B. Prompts (ένα ανά τύπο αρχείου)
- [x] Prompt **INFO/Gantt/KPI** — πλήρη, ready-to-send Anthropic request packages (`llm/prompts/*.request.json`, model+system+tools+tool_choice)
- [x] **Live test 2026-09-28** — και τα 3 requests τρέχουν κανονικά (`stop_reason: tool_use`) πάνω στο πλήρες, πραγματικό `.md` του Grant Agreement GAP-101158152 (107K tokens input/call), **0 σφάλματα validation** έναντι των schemas. Καμία αλλαγή prompt/schema δεν χρειάστηκε. Λεπτομέρειες, ποιοτικός έλεγχος και μετρημένο πραγματικό κόστος (~$0.38/GA): [`llm/testing-notes.md`](../llm/testing-notes.md). Raw outputs: `llm/examples/live-run-2026-09-28/`.

#### C. Τεκμηρίωση
- [x] `.md` αρχεία ανά schema/prompt + παραδείγματα input/output (`llm/schemas/README.md`, `llm/prompts/README.md`, `llm/examples/`)
- [x] `llm/prompts/build_requests.py` — regenerate τα request packages αν αλλάξουν τα schemas (schema/prompt δεν αποσυγχρονίζονται)
- [x] `llm/schemas/preview-mapping.md` — πώς το κάθε schema αντιστοιχεί στο frontend preview

**Επόμενο βήμα:** merge `llm` → `main`, μετά το backend καταναλώνει απευθείας τα `llm/prompts/*.request.json` (βλ. §5 backend D).

---

## 6. Κοινό API Contract (backend ↔ frontend)

Το κλειδωμένο v1 contract τεκμηριώνεται στο [`api-contract.md`](api-contract.md) και είναι κοινό για backend, frontend και llm. Οι λεπτομέρειες εκεί είναι η πηγή αλήθειας για request/response shapes, status, preview, download filenames/headers, errors, CORS και retention.

```
POST   /upload                      multipart/form-data (PDF) → { requestId }
GET    /status/{requestId}          → { status, progress, message }
GET    /preview/{requestId}         → { info: {html}, gantt: {sheets: [...]}, kpi: {sheets: [...]} }
GET    /download/{requestId}/{type} → file (type: info | gantt | kpi)
GET    /download-all/{requestId}    → .zip
```

`status` values: `scanning` → `extracting` → `analyzing` → `generating` → `done` | `error`
`done` σημαίνει ότι και τα τρία τελικά αρχεία και τα preview δεδομένα είναι διαθέσιμα· το PDF parsing μόνο του δεν αρκεί. Το v1 contract ορίζει upload έως 25 MiB, UUID v4 `requestId`, Excel previews με `sheets[]`, σταθερά filenames και `Content-Disposition: attachment`. Διατήρηση δεδομένων έως 24 ώρες· CORS allowlist ρυθμίζεται ανά deployment μέσω `CORS_ORIGINS`. Αναλυτικά στο `docs/api-contract.md`.

Excel previews — ένα στοιχείο ανά sheet, με τη σειρά του workbook (συμφωνήθηκε με backend 2026-09-25):

```ts
gantt: { sheets: [{ name: string, headers: string[], rows: (string | number | null)[][] }] }
kpi:   { sheets: [{ name: string, headers: string[], rows: (string | number | null)[][] }] }
```

Το `GET /preview` είναι **προαιρετικό** για τον χρήστη: το frontend το καλεί μόνο όταν ανοίξει το πρώτο preview (μία φορά για όλα τα αρχεία).

## 7. Ανοιχτά σημεία προς απόφαση

- [x] ~~Μέγιστο εύρος μηνών/WPs στα Excel templates~~ — αποφασίστηκε 2026-09-28: `MAX_TOTAL_MONTHS=48`, `MAX_WORK_PACKAGES=30`, `MAX_KPI_CATEGORIES=40` (`backend/src/document-generation/render-limits.ts`), όχι τεχνικός περιορισμός αλλά sanity guard αφού το rendering είναι πλέον δυναμικό (§5.F)
- [x] ~~Ακριβές μέγεθος/typical σελίδες Grant Agreement (επηρεάζει αν χρειάζεται chunking πριν το LLM)~~ — **διορθωμένο συμπέρασμα 2026-09-30**: το 1ο δοκιμασμένο GA (EVOLVE2CARE, 5.955 γραμμές .md) χωρούσε άνετα χωρίς chunking, αλλά ένα 2ο, μεγαλύτερο GA (VIGILANCE, 9.657 γραμμές .md, 761K chars) **ξεπέρασε το όριο των 200K tokens** και απέτυχε εξ ολοκλήρου. Λύθηκε **όχι** με chunking, αλλά με στοχευμένο trimming: το `extract_to_markdown.py` πλέον αφαιρεί το γενικό "Terms & Conditions" άρθρα-σώμα και τα Annexes 2-5 (budget/νομικά έντυπα) που κανένα από τα 3 prompts δεν χρειάζεται — μόνο Preamble+DataSheet+Annex1 μένουν. Βλ. `llm/testing-notes.md` §"Second GA test".
- [ ] Error/retry UX σε αποτυχία LLM parsing
- [ ] Anthropic API key management & budget cap — πραγματικοί αριθμοί αναφοράς από 2 GAs: ~$0.38 (EVOLVE2CARE, 24μηνο/6WP) έως ~$0.59 (VIGILANCE, 36μηνο/8WP/50 deliverables), μετρημένα 2026-09-28/30, `llm/testing-notes.md`
- [x] ~~Σειρά merge προς `main` (ποιο branch πρώτο)~~ — έγινε 2026-09-30: πρώτα `backend` (περιείχε ήδη όλο το `llm`), μετά `frontend`. Καθαρά merges, ένα μικρό conflict μόνο σε αυτό το αρχείο.
- [ ] **Deploy path**: το `backend/dist` διαβάζει `../../../llm/prompts/*.request.json` με σχετικό path (`llm/request-packages.ts`) — το Render build root πρέπει να περιλαμβάνει το `llm/` folder δίπλα στο `backend/`, βρέθηκε κατά τη διάρκεια local testing όταν το τρέξιμο από λάθος git branch (χωρίς `llm/`) έσπασε το LLM extraction στάδιο σιωπηλά μέχρι τον έλεγχο logs

## 8. Σειρά προτεραιότητας (ενημερωμένη 2026-09-30)

**Κατάσταση: `backend` (μαζί με `llm`) και `frontend` merged στο `main`** (2026-09-30) — καθαρό merge και για τα δύο, ένα μόνο conflict (`docs/implementation-plan.md`, λυμένο). `pnpm build` επιβεβαιωμένο καθαρό πάνω στο ενοποιημένο `main`. Το `main` πλέον περιέχει ολόκληρη τη λύση: backend pipeline (δοκιμασμένο end-to-end με πραγματικό Supabase+Redis), frontend UI (ακόμα πάνω σε mocks), llm schemas/prompts (δοκιμασμένα σε 3 πραγματικά GAs).

1. ~~Templates (Γιώργος) + JSON Schemas (Αριστείδης)~~ — schemas/prompts έτοιμα και δοκιμασμένα· τα Excel templates έγιναν δυναμικό rendering αντί για static αρχεία (βλ. §5.F)
2. ~~API contract (§6)~~ — κλειδωμένο στο `docs/api-contract.md`
3. ~~Backend: LLM integration (§5.D) + validation (§5.E)~~ — ολοκληρωμένο, δοκιμασμένο live
4. ~~Backend: document generation engine (§5.F-G) + worker ολοκλήρωση~~ — ολοκληρωμένο, δοκιμασμένο end-to-end
5. ~~Backend: preview/download HTTP endpoints (§5.H)~~ — ολοκληρωμένο, δοκιμασμένο
6. ~~Backend: πραγματική σύνδεση Supabase Storage + Upstash Redis (§5.A)~~ — ολοκληρωμένο, δοκιμασμένο (πραγματικό project/bucket/Redis instance του χρήστη)
7. ~~Integration testing end-to-end με πραγματικό Supabase/Redis~~ — ολοκληρωμένο: πραγματικό HTTP upload → queue → worker → storage → preview/download, όλα επιτυχή
8. ~~Merge `backend`+`llm`+`frontend` → `main`~~ — ολοκληρωμένο 2026-09-30
9. **Τώρα:**
   - Backend: deploy σε Render.com (free tier) — **σημαντικό:** το `backend/dist` διαβάζει το sibling `llm/prompts/*.request.json` με σχετικό path, άρα το deploy build root πρέπει να περιλαμβάνει και το `llm/` folder, όχι μόνο το `backend/` (βρέθηκε κατά τα local tests, §7)
   - Frontend: deploy σε Vercel, μετά switch `NEXT_PUBLIC_API_URL` στο live backend URL
10. Ops: cleanup job (storage retention), Redis TTL σε status keys, budget cap (§5.I)
