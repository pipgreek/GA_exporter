# GA Exporter — Implementation Plan

## 1. Σύνοψη εφαρμογής

Web εργαλείο που παίρνει ένα **Grant Agreement PDF**, το αναλύει (parsing + LLM), και παράγει αυτόματα **3 αρχεία**:

1. **INFO document** (Word) — γενικά στοιχεία project, WPs, roles
2. **Gantt Chart** (Excel) — χρονοδιάγραμμα WPs/Tasks/Deliverables/Milestones
3. **KPI Monitoring** (Excel) — δείκτες παρακολούθησης ανά κατηγορία/μήνα

Ο χρήστης ανεβάζει το PDF, βλέπει read-only preview των 3 αρχείων, κάνει confirm, και κατεβάζει (μεμονωμένα ή σε .zip). **Χωρίς inline editing, χωρίς login/ιστορικό, χωρίς database.**

## 2. Αρχιτεκτονική ροή

```
Upload PDF
   → parsing (pdfplumber/Unstructured.io, χωρίς LLM) → .md
   → 3 παράλληλα LLM calls (Claude Haiku, tool-use/structured output)
        κάθε ένα: prompt + JSON schema συγκεκριμένο ανά τύπο αρχείου
   → validation (Zod/Pydantic) στο κάθε JSON
   → validated JSON γεμίζει προκαθορισμένο template
        (docxtemplater για Word, exceljs για Excel)
   → ίδιο JSON τροφοδοτεί frontend preview (μία πηγή αλήθειας)
   → Preview (read-only, expand modal 90%)
   → Confirm → σελίδα /result → Download (μεμονωμένα ή .zip)
```

Καμία μόνιμη αποθήκευση: Redis (ephemeral status, TTL) + Supabase Storage (προσωρινά αρχεία, cleanup job).

## 3. Τεχνολογική στοίβα (όλα open-source/δωρεάν)

| Επίπεδο | Τεχνολογία |
|---|---|
| Frontend framework | Next.js + React + TypeScript |
| Styling | Tailwind CSS |
| Upload | react-dropzone |
| Word preview | mammoth.js (docx→HTML) + DOMPurify |
| Excel preview | react-data-grid ή `<table>` (read-only) |
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
- [ ] `POST /upload` — δέχεται PDF (multipart/form-data), validation τύπου αρχείου, αποθήκευση στο Supabase Storage, δημιουργία `requestId`, βάζει job στην ουρά (BullMQ)
- [ ] Worker process — καταναλώνει jobs από την ουρά, εκτελεί το pipeline, ενημερώνει status στο Redis σε κάθε βήμα
- [ ] `GET /status/{requestId}` — επιστρέφει `{ status, progress, message }`

#### C. PDF → Markdown
- [ ] Ενσωμάτωση pdfplumber/Unstructured.io
- [ ] Εξαγωγή κειμένου + πινάκων σε δομημένο `.md`
- [ ] Test με το δείγμα PDF (Grant Agreement GAP-101158152)

#### D. LLM integration (χρησιμοποιεί τα schemas/prompts από branch `llm`)
- [ ] Anthropic SDK setup, Claude Haiku client
- [ ] 3 service functions: `generateInfoJson()`, `generateGanttJson()`, `generateKpiJson()` — tool-use/structured output calls
- [ ] Παράλληλη εκτέλεση των 3 calls
- [ ] Retry logic σε αποτυχία validation (1-2 retries)

#### E. Validation
- [ ] Zod schemas (ένα ανά τύπο αρχείου — κοινά με το `llm` branch contract)
- [ ] Error handling / error state στο status αν αποτύχει μετά τα retries

#### F. Templates (Word/Excel) — **[owner: Γιώργος]**
- [ ] Δημιουργία κενού Word template (INFO) με placeholders (docxtemplater syntax), βασισμένο στο δείγμα "info tab"
- [ ] Δημιουργία κενού Excel template (Gantt) — sheets: Overview, Deliverables' List, Milestones' List — βασισμένο στα EVOLVE2CARE/RE-SPHERE δείγματα
- [ ] Δημιουργία κενού Excel template (KPI) — βασισμένο στο VIGILANCE δείγμα
- [ ] Ορισμός μέγιστου εύρους (π.χ. μήνες/WPs) που καλύπτουν τα templates
- [ ] Αποθήκευση templates στο repo (`backend/templates/`)

#### G. Document generation engine
- [ ] `renderInfoDoc(json)` — docxtemplater fill → .docx
- [ ] `renderGanttExcel(json)` — exceljs fill (μήνες/στήλες, χρωματισμός D/MS markers, duplicateRow για λίστες) → .xlsx
- [ ] `renderKpiExcel(json)` — exceljs fill → .xlsx
- [ ] Αποθήκευση παραγόμενων αρχείων στο Supabase Storage (`{requestId}/output/*`)

#### H. Preview & Download endpoints
- [ ] `GET /preview/{requestId}` — επιστρέφει `{ info: {html}, gantt: {headers, rows}, kpi: {headers, rows} }`
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
- [x] Βασικό routing: `/` και `/result`

#### B. Home page — upload & progress
- [ ] `UploadDropzone` component (react-dropzone, μόνο PDF, disabled μετά το upload)
- [ ] Preview μικρογραφίας ανεβασμένου αρχείου + κουμπί διαγραφής (X)
- [ ] Κουμπί **Start** (disabled μέχρι upload), `POST /upload` μέσω FormData
- [ ] `ProgressIndicator` component — polling `GET /status/{requestId}` (setInterval 2-3s), μηνύματα ανά status, fallback rotation μηνυμάτων, timeout 90s

#### C. Preview (read-only)
- [ ] `PreviewCard` component (x3, ένα ανά τύπο αρχείου)
- [ ] `WordViewer` — mammoth HTML (από backend) + DOMPurify.sanitize + dangerouslySetInnerHTML
- [ ] `ExcelViewer` — read-only πίνακας (react-data-grid ή `<table>`) από JSON headers/rows
- [ ] `PreviewModal` (radix-ui/headlessui dialog) — expand 90%, internal scroll, close (X) επιστρέφει εκεί που ήταν
- [ ] Κουμπί **Confirm** → `router.push('/result?requestId=...')`

#### D. Result page
- [ ] 3 `DownloadCard` components (όνομα αρχείου + Download button)
- [ ] Κουμπί **Download all (.zip)**
- [ ] Κουμπί **Return to Home Page**

#### E. Error states
- [ ] UI για σφάλμα upload (λάθος τύπος αρχείου)
- [ ] UI για σφάλμα processing (timeout/αποτυχία LLM μετά τα retries)

**Dependency:** χρειάζεται το API contract (§6 παρακάτω) νωρίς για να δουλέψει με mock data πριν είναι έτοιμο το πραγματικό backend.

---

### 🧠 Αριστείδης — branch `llm`

#### A. JSON Schemas (contract με backend, .md/.json αρχεία)
- [ ] Schema **INFO**: `{ contract, gaNumber, callTopic, typeOfAction, duration, reportingPeriods[], workPackages[], roles[] }`
- [ ] Schema **Gantt**: `{ workPackages[{id, name, startMonth, endMonth, lead, tasks[]}], deliverables[], milestones[] }`
- [ ] Schema **KPI**: `{ categories[{name, kpis[{label, target, achieved, monthlyValues[]}]}] }`
- [ ] Καθορισμός required/optional fields, τύποι δεδομένων

#### B. Prompts (ένα ανά τύπο αρχείου)
- [ ] Prompt **INFO** — οδηγίες εξαγωγής γενικών στοιχείων + WPs/roles από το `.md`
- [ ] Prompt **Gantt** — οδηγίες εξαγωγής χρονοδιαγράμματος/deliverables/milestones
- [ ] Prompt **KPI** — οδηγίες εξαγωγής δεικτών παρακολούθησης
- [ ] Test prompts πάνω στο δείγμα Grant Agreement (GAP-101158152) — έλεγχος ποιότητας εξαγωγής

#### C. Τεκμηρίωση
- [ ] `.md` αρχεία με το κάθε schema + prompt + παραδείγματα input/output
- [ ] Οδηγίες για tool-use/structured output format (πώς να μεταφραστεί το schema σε Anthropic tool definition)

**Dependency:** το backend χρειάζεται αυτά τα schemas/prompts για να υλοποιήσει τα §D του backend plan — καλό να είναι από τα πρώτα πράγματα που κλειδώνουν.

---

## 6. Κοινό API Contract (backend ↔ frontend)

```
POST   /upload                      multipart/form-data (PDF) → { requestId }
GET    /status/{requestId}          → { status, progress, message }
GET    /preview/{requestId}         → { info: {html}, gantt: {headers, rows}, kpi: {headers, rows} }
GET    /download/{requestId}/{type} → file (type: info | gantt | kpi)
GET    /download-all/{requestId}    → .zip
```

`status` values: `scanning` → `extracting` → `analyzing` → `generating` → `done` | `error`

## 7. Ανοιχτά σημεία προς απόφαση

- [ ] Μέγιστο εύρος μηνών/WPs στα Excel templates
- [ ] Ακριβές μέγεθος/typical σελίδες Grant Agreement (επηρεάζει αν χρειάζεται chunking πριν το LLM)
- [ ] Error/retry UX σε αποτυχία LLM parsing
- [ ] Anthropic API key management & budget cap
- [ ] Σειρά merge προς `main` (ποιο branch πρώτο)

## 8. Σειρά προτεραιότητας (προτεινόμενη)

1. **Templates** (Γιώργος) + **JSON Schemas** (Αριστείδης) — παράλληλα, πρώτα — ορίζουν το contract για όλους
2. **API contract** (§6) — κλειδώνει νωρίς ώστε frontend/backend να δουλέψουν παράλληλα με mocks
3. Backend pipeline (upload → parsing → LLM → templates → download) και Frontend UI — παράλληλα
4. Integration testing end-to-end
5. Merge σε `main`
