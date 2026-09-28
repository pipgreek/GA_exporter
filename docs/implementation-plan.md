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
- [ ] NestJS project scaffold (`backend/`)
- [ ] Σύνδεση Upstash Redis (queue)
- [ ] Σύνδεση Supabase Storage (file storage)
- [ ] Deploy pipeline σε Render.com (free tier)
- [ ] Env vars / secrets management (Anthropic API key κ.λπ.)

#### B. Upload & queue
- [x] `POST /upload` — δέχεται PDF (multipart/form-data), ελέγχει το PDF signature, αποθήκευση στο Supabase Storage, δημιουργία `requestId`, βάζει job στην ουρά (BullMQ)
- [ ] Worker process — καταναλώνει jobs από την ουρά, εκτελεί το pipeline, ενημερώνει status στο Redis σε κάθε βήμα
- [x] `GET /status/{requestId}` — επιστρέφει `{ status, progress, message }`

#### C. PDF → Markdown
- [x] Ενσωμάτωση pdfplumber (`extract_to_markdown.py` + `pdf-parser.service.ts`)
- [x] Εξαγωγή κειμένου + πινάκων σε δομημένο `.md`
- [x] Test με το δείγμα PDF (Grant Agreement GAP-101158152) — βλ. `docs/Παραδείγματα/Grant Agreement - GAP-101158152.md`

> **Κατάσταση 2026-09-28:** ο worker (`pdf-processing.processor.ts`) σταματάει εδώ («analysis and file generation are pending»). Τα βήματα D-H παρακάτω δεν είναι ακόμα καλωδιωμένα στο pipeline.

#### D. LLM integration (χρησιμοποιεί τα schemas/prompts από branch `llm`)
- [ ] Anthropic SDK setup, Claude Haiku client
- [ ] 3 service functions: `generateInfoJson()`, `generateGanttJson()`, `generateKpiJson()` — tool-use/structured output calls (τα ready-to-send request packages υπάρχουν ήδη στο `llm/prompts/*.request.json`, εκκρεμεί merge `llm`→`main` και wiring)
- [ ] Παράλληλη εκτέλεση των 3 calls
- [ ] Retry logic σε αποτυχία validation (1-2 retries)

#### E. Validation
- [ ] Zod schemas (mirror των `llm/schemas/*.schema.json`)
- [ ] Error handling / error state στο status αν αποτύχει μετά τα retries

#### F. Templates (Word/Excel) — **[owner: Γιώργος]**
- [x] Αρχεία-αφετηρία ανέβηκαν στο repo (`docs/templates/`: Gantt EVOLVE2CARE, KPI VIGILANCE, Info docx)
- [ ] Μετατροπή σε **κενά** templates με placeholders (docxtemplater syntax για Word, named cells/template rows για Excel) — τα τρέχοντα αρχεία έχουν ακόμα πραγματικά δεδομένα παραδειγμάτων, όχι placeholders
- [ ] Ορισμός μέγιστου εύρους (π.χ. μήνες/WPs) που καλύπτουν τα templates
- [ ] Μετακίνηση/οργάνωση των τελικών templates σε `backend/templates/`

#### G. Document generation engine
- [ ] `renderInfoDoc(json)` — docxtemplater fill → .docx
- [ ] `renderGanttExcel(json)` — exceljs fill (μήνες/στήλες, χρωματισμός D/MS markers, duplicateRow για λίστες) → .xlsx
- [ ] `renderKpiExcel(json)` — exceljs fill → .xlsx
- [ ] Αποθήκευση παραγόμενων αρχείων στο Supabase Storage (`{requestId}/output/*`)

#### H. Preview & Download endpoints
- [ ] `GET /preview/{requestId}` — επιστρέφει `{ info: {html}, gantt: {sheets[]}, kpi: {sheets[]} }` (βλ. §6). Το frontend το καλεί μόνο όταν ο χρήστης ανοίξει preview.
- [ ] `GET /download/{requestId}/{fileType}` — signed URL ή direct stream από Supabase Storage
- [ ] `GET /download-all/{requestId}` — δημιουργία .zip (archiver) on-the-fly ή προ-δημιουργημένο

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

**Κατάσταση 2026-09-28: ουσιαστικά ολοκληρωμένο.** Εκκρεμεί μόνο merge `llm` → `main`.

#### A. JSON Schemas (contract με backend, .md/.json αρχεία)
- [x] Schema **INFO** (`llm/schemas/info.schema.json`)
- [x] Schema **Gantt** (`llm/schemas/gantt.schema.json`)
- [x] Schema **KPI** (`llm/schemas/kpi.schema.json`)
- [x] Required/optional fields, τύποι δεδομένων — τεκμηριωμένα στο `llm/schemas/README.md`

#### B. Prompts (ένα ανά τύπο αρχείου)
- [x] Prompt **INFO/Gantt/KPI** — πλήρη, ready-to-send Anthropic request packages (`llm/prompts/*.request.json`, model+system+tools+tool_choice)
- [x] Test πάνω στο δείγμα Grant Agreement (GAP-101158152) — αποτελέσματα σε `llm/examples/*.example.md`

#### C. Τεκμηρίωση
- [x] `.md` αρχεία ανά schema/prompt + παραδείγματα input/output (`llm/schemas/README.md`, `llm/prompts/README.md`, `llm/examples/`)
- [x] `llm/prompts/build_requests.py` — regenerate τα request packages αν αλλάξουν τα schemas (schema/prompt δεν αποσυγχρονίζονται)
- [x] `llm/schemas/preview-mapping.md` — πώς το κάθε schema αντιστοιχεί στο frontend preview

**Επόμενο βήμα:** merge `llm` → `main`, μετά το backend καταναλώνει απευθείας τα `llm/prompts/*.request.json` (βλ. §5 backend D).

---

## 6. Κοινό API Contract (backend ↔ frontend)

Το κλειδωμένο v1 contract τεκμηριώνεται στο [`api-contract.md`](api-contract.md). Οι λεπτομέρειες εκεί είναι η πηγή αλήθειας για request/response shapes, status, preview, download filenames/headers, errors, CORS και retention.

```
POST   /upload                      multipart/form-data (PDF) → { requestId }
GET    /status/{requestId}          → { status, progress, message }
GET    /preview/{requestId}         → { info: {html}, gantt: {sheets: [...]}, kpi: {sheets: [...]} }
GET    /download/{requestId}/{type} → file (type: info | gantt | kpi)
GET    /download-all/{requestId}    → .zip
```

`status` values: `scanning` → `extracting` → `analyzing` → `generating` → `done` | `error`
`done` σημαίνει ότι και τα τρία τελικά αρχεία και τα preview δεδομένα είναι έτοιμα· το PDF parsing μόνο του δεν αρκεί.

Excel previews — ένα στοιχείο ανά sheet, με τη σειρά του workbook (συμφωνήθηκε με backend 2026-09-25):

```ts
gantt: { sheets: [{ name: string, headers: string[], rows: (string | number | null)[][] }] }
kpi:   { sheets: [{ name: string, headers: string[], rows: (string | number | null)[][] }] }
```

Το `GET /preview` είναι **προαιρετικό** για τον χρήστη: το frontend το καλεί μόνο όταν ανοίξει το πρώτο preview (μία φορά για όλα τα αρχεία).

## 7. Ανοιχτά σημεία προς απόφαση

- [ ] Μέγιστο εύρος μηνών/WPs στα Excel templates
- [ ] Ακριβές μέγεθος/typical σελίδες Grant Agreement (επηρεάζει αν χρειάζεται chunking πριν το LLM)
- [ ] Error/retry UX σε αποτυχία LLM parsing
- [ ] Anthropic API key management & budget cap
- [ ] Σειρά merge προς `main` (ποιο branch πρώτο)

## 8. Σειρά προτεραιότητας (ενημερωμένη 2026-09-28)

**Κατάσταση:** `llm` ουσιαστικά έτοιμο (εκκρεμεί merge) · `frontend` πλήρες αλλά πάνω σε mocks, ήδη στο `main` · `backend` έχει infra+PDF→Markdown έτοιμα, σταματάει πριν το LLM/rendering στάδιο.

1. ~~Templates (Γιώργος) + JSON Schemas (Αριστείδης)~~ — schemas/prompts έτοιμα· τα templates χρειάζονται ακόμα μετατροπή σε placeholder-ready (βλ. §5.F)
2. ~~API contract (§6)~~ — κλειδωμένο στο `docs/api-contract.md`
3. **Τώρα:**
   - Merge `llm` → `main`
   - Backend: μετατροπή templates σε placeholder-ready + LLM integration (§5.D) + validation (§5.E) + document generation (§5.G) + preview/download endpoints (§5.H)
   - Frontend: switch από mock API routes στο πραγματικό backend, μόλις τα endpoints είναι έτοιμα
4. Integration testing end-to-end (πραγματικό PDF → download αρχεία)
5. Ops: deploy Render/Vercel, cleanup job, Redis TTL, budget cap (§5.A, §5.I)
6. Merge backend/frontend σε `main`
