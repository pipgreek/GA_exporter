# Frontend — Σημειώσεις & ανοιχτά σημεία

Συμπληρωματικό του [Implementation Plan](implementation-plan.md) (§5 Frontend, §6 API contract). Υπεύθυνη: Θεοδώρα.

## Πηγές προδιαγραφών

| Αρχείο | Τι περιέχει |
|---|---|
| [implementation-plan.md](implementation-plan.md) | Tasks frontend (§5) και το κοινό API contract με το backend (§6) |
| [frontend UI UX/index.html](frontend%20UI%20UX/index.html) | Στατικό mockup (Tailwind) — αναφορά για το design. ⚠️ Η ροή Confirm → result page του mockup αντικαταστάθηκε από την απόφαση 6. |

## Τι πρέπει να υλοποιηθεί

Όλη η ροή γίνεται στην αρχική σελίδα `/` (απόφαση 6):

1. **Upload:** dropzone μόνο για PDF, κλειδώνει μετά το upload· μικρογραφία αρχείου με «Χ» (ξεκλειδώνει)· **Start** disabled μέχρι upload → `POST /upload` (FormData).
2. **Progress:** polling `GET /status/{requestId}` ανά 2–3", progress bar + μήνυμα ανά status, fallback rotation μηνυμάτων όταν το status δεν αλλάζει, timeout 150".
3. **Αρχεία:** μόλις έρθει `done`, εμφανίζονται κατευθείαν 3 κάρτες (INFO/Word, Gantt/Excel, KPI/Excel) κάτω από το upload, χωρίς να καθαρίζει η οθόνη. Κάθε κάρτα έχει **Download** και **Preview**.
4. **Preview (προαιρετικό, read-only):** modal 90% με εσωτερικό scroll και «Χ». Word = HTML από backend + `DOMPurify.sanitize`· Excel = read-only πίνακας, μία καρτέλα ανά sheet. Το `GET /preview` καλείται μόνο στο πρώτο άνοιγμα.
5. **Downloads:** Download ανά αρχείο, **Download all (.zip)**, **Process another Grant Agreement**.
6. **Error states:** λάθος τύπος αρχείου, αποτυχία/timeout επεξεργασίας, αποτυχία φόρτωσης preview (Retry).

Μέχρι να είναι έτοιμο το backend, το frontend δουλεύει με **mock data** πάνω στο contract του §6.

## Στοιχεία από το mockup

Logo ViLabs (επιστροφή στην αρχική), animated background, toast για σφάλματα, confirm modals (διαγραφή αρχείου, επιστροφή στην αρχική, μετάβαση στο Privacy Policy), σελίδα Privacy Policy, footer.

## Αποφάσεις (2026-09-25)

Όπου το mockup διαφέρει από το plan, **υπερισχύει το plan**. (Το `Frontend Description.docx` και τα wireframes `1.png`–`4.png` αφαιρέθηκαν από το repo στις 2026-09-25· υπάρχουν στο ιστορικό του git.)

| # | Θέμα | Απόφαση |
|---|---|---|
| 1 | Edit mode (μολυβάκι) | **Αφαιρείται.** Τα previews είναι αυστηρά read-only, όπως ορίζει το plan. Κανένα εικονίδιο/λειτουργία επεξεργασίας. (Αφαιρέθηκε και από το docx / `3.png` στη V1.) |
| 2 | Ονόματα status | **Όπως το plan (§6):** `scanning` → `extracting` → `analyzing` → `generating` → `done` \| `error`. (Διορθώθηκε και στο docx.) |
| 3 | Result page | ~~Ξεχωριστό route `/result?requestId=...`~~ → **αντικαταστάθηκε από την απόφαση 6** (δεν υπάρχει πια `/result`). |
| 4 | Logo | **Μετονομάστηκε σε `vilabs-logo.png`** (lowercase, ταιριάζει με το mockup, ασφαλές σε case-sensitive hosting όπως το Vercel). |
| 5 | Excel previews με πολλά sheets | **Συμφωνήθηκε με το backend:** `gantt`/`kpi` = `{ sheets: [{ name, headers, rows }] }`, με τη σειρά του workbook. Το `ExcelViewer` δείχνει μία καρτέλα ανά sheet. |
| 7 | Σύνδεση με backend (2026-09-30) | **Χωρίς demo mode.** Η εφαρμογή συνδέεται μόνο με το backend του `NEXT_PUBLIC_API_URL`. Στο άνοιγμα της αρχικής γίνεται `GET /health`· αν αποτύχει (ή λείπει η ρύθμιση, ή περάσουν 60") εμφανίζεται σελίδα «Service unavailable» με «Try again», σαν να έχει πέσει το σύστημα. Το mock μένει μόνο ως εργαλείο ανάπτυξης, με ρητή ρύθμιση. |
| 6 | Ροή αποτελεσμάτων (επιλογή **B**) | Αφού δεν υπάρχει edit, το Confirm δεν προσέφερε κάτι. Μόλις έρθει `done`, τα 3 αρχεία εμφανίζονται **κατευθείαν στην αρχική** ως κάρτες με **Download** + **προαιρετικό Preview**. Καταργήθηκαν το Confirm και η σελίδα `/result`· το «Return to Home Page» γίνεται «Process another Grant Agreement». |

Αντιστοίχιση status → μήνυμα UI:

| status | Μήνυμα |
|---|---|
| `scanning` | Scanning Grant Agreement... |
| `extracting` | Extracting text and structure... |
| `analyzing` | Analyzing Work Packages and KPIs... |
| `generating` | Generating files... |
| `done` | Files generated successfully. |
| `error` | Error state (βλ. Error states) |

## Mock backend (μέχρι να στηθεί το πραγματικό)

Το πραγματικό backend υπάρχει πλέον στο `backend/` (από το merge του `main`, 2026-09-30), αλλά για να τρέξει τοπικά χρειάζεται κλειδιά/υποδομές (βλ. «Τοπική σύνδεση με το πραγματικό backend»). Για ανάπτυξη χωρίς αυτά υπάρχει **mock backend μέσα στο Next.js** (`frontend/src/app/api/mock`), με τα ίδια endpoints/σχήματα με το contract §6. Όλες οι κλήσεις περνούν από το `frontend/src/lib/api/client.ts`:

- Η εφαρμογή χρησιμοποιεί **μόνο** το `NEXT_PUBLIC_API_URL` (απόφαση 7) — δεν υπάρχει demo mode ούτε αυτόματη χρήση του mock.
- Για τοπική ανάπτυξη χωρίς backend: `NEXT_PUBLIC_API_URL=http://localhost:3000/api/mock` στο `.env.local` (μόνο `npm run dev`· σε production τα `/api/mock/*` δίνουν 404).

Σενάρια (από το όνομα του PDF): κανονικό (~15"), `error` (αποτυχία στο `analyzing`), `slow` (κολλάει στο `analyzing` → έλεγχος timeout 150"), `preview-error` (το preview αποτυγχάνει τα πρώτα 20"). Λεπτομέρειες στο `frontend/README.md`.

## Τοπική σύνδεση με το πραγματικό backend

Το `run-local.bat` (ρίζα του repo) στήνει backend (θύρα 3001) + frontend (θύρα 3000) και δημιουργεί το `frontend/.env.local` με `NEXT_PUBLIC_API_URL=http://localhost:3001`. Χρειάζεται:

- `backend/.env` (αντίγραφο του `backend/.env.example`) με `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `REDIS_URL` — τα κλειδιά δίνονται από την ομάδα backend και **δεν** μπαίνουν ποτέ στο git.
- Python (για το PDF parsing, `PDF_PYTHON_EXECUTABLE`) με τα πακέτα του `backend/requirements.txt`.
- Redis: τοπικό μέσω Docker (`backend/docker-compose.yml`) ή URL του Upstash.
- Στον υπολογιστή της Θεοδώρας (2026-09-30): **δεν** υπάρχουν ακόμα Python (μόνο το stub του Microsoft Store), Docker, `backend/.env`.

## API contract v1 — κλειδωμένο

Οι routes και οι payloads ακολουθούν `docs/api-contract.md` (canonical) και το §6 του implementation plan:

- `POST /upload`, multipart field `file`, PDF έως 25 MiB, returns `202 { requestId }`.
- `GET /status/{requestId}` returns `{ status, progress, message }`. `done` σημαίνει ότι είναι έτοιμα και τα 3 αρχεία και τα preview δεδομένα.
- Excel preview: `{ sheets: [{ name, headers, rows }] }` για Gantt/KPI.
- Downloads: σταθερά filenames από `src/lib/files.ts`; το `Content-Disposition` είναι η πηγή αλήθειας για το filename.
- Διατήρηση δεδομένων έως 24 ώρες. Το storage cleanup πρέπει ακόμη να υλοποιηθεί στο backend.
- Δεν υπάρχει cancel endpoint. Αφαίρεση/reset στο UI εγκαταλείπει την προβολή του request, αλλά δεν σταματά το backend job.
- CORS: backend allowlist μέσω `CORS_ORIGINS`; production origin συμπληρώνεται κατά το deployment.
- Local origins: frontend `localhost:3000`, backend `localhost:3001`; `NEXT_PUBLIC_API_URL` δείχνει στο backend.

## Privacy Policy — προς επιβεβαίωση πριν τη δημοσίευση

Το κείμενο (`src/app/privacy/page.tsx`) γράφτηκε με βάση τη ροή δεδομένων του plan (§1–§3). Πριν πάει live χρειάζεται επιβεβαίωση:

- **Διάρκεια διατήρησης** (24 ώρες) = cleanup job / Redis TTL του backend.
- **Περιοχές (regions) των παρόχων** (Vercel, Render, Supabase, Upstash, Anthropic) και αν υπάρχουν συμβάσεις επεξεργασίας (DPA) / Standard Contractual Clauses — η ενότητα 5 λέει ότι οι μεταφορές εκτός ΕΟΧ καλύπτονται από SCCs.
- **Όροι του Anthropic API** για χρήση/διατήρηση των δεδομένων που στέλνονται.
- **Νομικός έλεγχος** από υπεύθυνο της VILABS (δεν είναι νομικό κείμενο εγκεκριμένο από νομικό).
- Αν στο μέλλον προστεθούν cookies/analytics (π.χ. Vercel Analytics), να ενημερωθεί η ενότητα 8.
- Οι περιοχές/όροι των παρόχων και η νομική επιβεβαίωση της Privacy Policy παραμένουν πριν τη δημοσίευση.

## Ημερολόγιο προόδου

Νεότερα πάνω. Ενημερώνεται μετά από κάθε ολοκληρωμένο βήμα.

### 2026-09-30 — Εκκρεμότητες frontend (κατάσταση)
- Το `main` ενημερώθηκε στο `d9ff2f3` (ίδιο με `frontend`).
- **Έλεγχος με πραγματικό backend** (Gantt Overview με μήνες σε στήλες, INFO HTML, μηνύματα/χρόνοι): θα γίνει από τη Θεοδώρα αργότερα.
- **Error/retry UX σε αποτυχία LLM** (plan §7): απόφαση ομάδας· αν χρειαστεί retry χωρίς νέο upload → endpoint στο backend + μικρή αλλαγή στο frontend.
- **Privacy Policy**: έλεγχος με τον pipgreek (βλ. «Privacy Policy — προς επιβεβαίωση»).
- **Αυτόματα tests**: αναβλήθηκαν. Πρόταση όταν γίνει deploy: λίστα χειροκίνητου ελέγχου και/ή 1–2 end-to-end tests (Playwright) για τη βασική ροή.
- **Deploy**: χωρίς ημερομηνία. Σειρά: backend στο Render → frontend στο Vercel (`NEXT_PUBLIC_API_URL`) → `CORS_ORIGINS` στο backend με τη διεύθυνση του Vercel.
- **KPIs** (στοιχεία από τον Βασίλη): αλλαγές σε backend/LLM· το frontend δεν αναμένεται να αλλάξει.

### 2026-09-30 — Χωρίς demo mode, έλεγχος backend στο άνοιγμα ✅ (απόφαση 7)
- Αφαιρέθηκαν: η ένδειξη «Demo mode» (`ApiModeNotice`), η ρύθμιση `NEXT_PUBLIC_USE_MOCK_API` και η αυτόματη χρήση του mock (αντικαθιστούν την αμέσως προηγούμενη καταχώριση).
- Νέο `BackendGate` στην αρχική: `GET /health` (νέο `checkHealth()` στο `client.ts`) → εφαρμογή· αλλιώς «Service unavailable» + «Try again». Αναμονή έως 60" (Render free tier), με μήνυμα «The server is starting up…» μετά από 5".
- Mock: μόνο με ρητό `NEXT_PUBLIC_API_URL=http://localhost:3000/api/mock` και μόνο σε `npm run dev`· νέο mock `GET /health`.
- Το `GET /health` προστέθηκε στο `docs/api-contract.md` (υπήρχε ήδη στο backend, `backend/src/health`).
- Δοκιμασμένα: (α) χωρίς `NEXT_PUBLIC_API_URL` → «Service unavailable»· (β) backend κάτω (`localhost:3001`) → «Service unavailable» αμέσως, «Try again» ξαναδοκιμάζει· (γ) backend που δεν απαντά → «starting up» και «Service unavailable» στα 60"· (δ) backend που απαντά (mock ρητά) → κανονική ροή ως τα previews/downloads· (ε) production build χωρίς ρύθμιση → «Service unavailable», mock 404. Lint + TypeScript καθαρά.

### 2026-09-30 — Προστασία production από το mock ✅
- Νέο `src/lib/api/config.ts`: σε **production build** χωρίς `NEXT_PUBLIC_API_URL` το mock **δεν** χρησιμοποιείται — εμφανίζεται μήνυμα «not connected», το Start είναι ανενεργό και τα `/api/mock/*` επιστρέφουν 404 (`src/mocks/mockGuard.ts`). Για demo deploy: `NEXT_PUBLIC_USE_MOCK_API=true`.
- Όταν τρέχει το mock (dev ή demo), η αρχική δείχνει «Demo mode: simulated backend, files contain sample data» (`ApiModeNotice`).
- `.env.example` και `frontend/README.md` ενημερώθηκαν (πίνακας συμπεριφοράς).
- Δοκιμασμένα με πραγματικά production builds (`next build` + `next start`): (α) χωρίς ρυθμίσεις → μήνυμα + Start ανενεργό + mock 404· (β) `NEXT_PUBLIC_USE_MOCK_API=true` → mock + Demo mode· (γ) `NEXT_PUBLIC_API_URL=http://localhost:3001/` → το upload πάει στο `localhost:3001/upload` (όχι στο mock)· (δ) `npm run dev` → mock + Demo mode. Lint + TypeScript καθαρά.
- Για το deploy στο Vercel: ορισμός `NEXT_PUBLIC_API_URL` στα Environment Variables + η διεύθυνση του Vercel στο `CORS_ORIGINS` του backend.

### 2026-09-30 — Merge `main` → `frontend` ✅
- Το `frontend` πήρε από το `main` το ολοκληρωμένο backend, τα LLM schemas/prompts, τα templates, το `run-local.bat` και τις αλλαγές της ομάδας στο frontend (timeout 90" → **150"**, `.claude/launch.json`). Χωρίς conflicts.
- Ενημερώθηκαν οι αναφορές στο timeout (plan, αυτό το αρχείο, `frontend/README.md`) και προστέθηκε η ενότητα «Τοπική σύνδεση με το πραγματικό backend».
- Lint + TypeScript καθαρά μετά το merge.
- **Επόμενο βήμα:** δοκιμή του frontend με το πραγματικό backend (χρειάζεται `backend/.env` με τα κλειδιά από την ομάδα, Python και Redis — βλ. παραπάνω).

### 2026-09-28 — Κλείδωμα HTTP API contract v1 ✅
- Καταγράφηκαν routes, payloads, status semantics, multi-sheet previews, filenames/download headers, error body, 25 MiB όριο upload, CORS allowlist και retention στο `docs/api-contract.md`.
- Ευθυγραμμίστηκαν plan, API types, mock upload/size validation και file cards.
- Διορθώθηκε το κείμενο αφαίρεσης αρχείου: δεν υπάρχει cancel endpoint, άρα το backend job συνεχίζει.
- `done` σημαίνει ότι τα τρία outputs και τα previews είναι διαθέσιμα.
- Επόμενο: live LLM evaluation και ολοκλήρωση backend pipeline πριν ενεργοποιηθεί το πλήρες πραγματικό API.

### 2026-09-25 — Merge στο `main`
- Το `frontend` έγινε merge στο `main` (commit `b0b4e4f`). Το `main` είχε ήδη το backend (`8541401 Merge backend into main`), οπότε έγινε κανονικό merge (όχι αντικατάσταση) — χωρίς conflicts· στο `implementation-plan.md` κρατήθηκαν και τα κουτάκια του backend και οι αλλαγές του frontend.
- Σημείωση: το branch `frontend` δεν περιέχει ακόμα τον κώδικα του backend από το `main`. Όταν χρειαστεί (π.χ. για τοπική σύνδεση με το πραγματικό backend), κάνουμε merge `main` → `frontend`.

### 2026-09-25 — Καθαρισμός αρχικών εγγράφων
- Αφαιρέθηκαν από το `docs/` (κατόπιν αιτήματος): `1.png`–`4.png` (wireframes) και `Frontend Description.docx`, αφού η υλοποίηση και οι αποφάσεις είναι πλέον σε αυτό το αρχείο και στο plan. Ανακτώνται από το ιστορικό του git αν χρειαστούν. Το `Backend Description.docx` (backend) παραμένει.

### 2026-09-25 — Privacy Policy με βάση το plan ✅
- Το κείμενο του mockup αντικαταστάθηκε με νέο, βασισμένο στη ροή δεδομένων του plan: χωρίς λογαριασμούς/ιστορικό/βάση, τι δεδομένα (PDF, παραγόμενα αρχεία, status, τεχνικά logs), βήματα επεξεργασίας (εξαγωγή κειμένου → Claude/Anthropic → templates), πάροχοι (Vercel, Render, Supabase, Upstash, Anthropic), νομική βάση (άρθρο 6(1)(b)/(f) GDPR), διατήρηση 24 ωρών, καμία χρήση cookies/analytics (ελέγχθηκε στον κώδικα), δικαιώματα + Αρχή Προστασίας Δεδομένων (dpa.gr).
- Τα σημεία που θέλουν επιβεβαίωση πριν τη δημοσίευση: ενότητα «Privacy Policy — προς επιβεβαίωση».

### 2026-09-25 — Βήμα F: Logo & Privacy Policy ✅
- `NavigationGuard` (στο layout): η αρχική δηλώνει αν υπάρχει εργασία (ανεβασμένο αρχείο / παραγόμενα αρχεία)· logo και link Privacy ρωτούν πριν τη χάσουν.
- **Logo:** στην αρχική χωρίς αρχείο → scroll στην κορυφή· με αρχείο → «Return to Home?» → επαναφορά· από άλλη σελίδα → μετάβαση στο `/`.
- **Privacy Policy:** νέα σελίδα `/privacy` με το κείμενο του mockup (11 ενότητες, στοιχεία VILABS OE, «Back to Application»). Link στο footer· με αρχείο → «View Privacy Policy?»· ήδη στη σελίδα → scroll στην κορυφή.
- Footer: link Privacy Policy + κουμπί «Back to top» (όπως το mockup).
- Δοκιμασμένα: όλοι οι συνδυασμοί (με/χωρίς αρχείο, από `/` και `/privacy`, No/Yes στα modals), desktop + mobile. Lint, TypeScript, production build καθαρά.
- Νέο σημείο προς backend: η διάρκεια διατήρησης (24 ώρες) στο Privacy Policy.
- Τσεκαρίστηκαν στο plan: F (3/3). **Σύνολο frontend: 20/20 ✅**
- **Επόμενο βήμα:** σύνδεση με το πραγματικό backend μόλις είναι διαθέσιμο (`NEXT_PUBLIC_API_URL`) + κλείσιμο των σημείων «Προς επιβεβαίωση με το backend». Προαιρετικά: deploy του frontend στο Vercel (με mock) για επίδειξη.

### 2026-09-25 — Βήμα D: Downloads ✅
- `FileCard`: όνομα αρχείου + **Download** (`<a href download>` προς `GET /download/{id}/{type}`) + Preview.
- **Download all (.zip)** → `GET /download-all/{id}`.
- **Process another Grant Agreement** → confirm modal («Make sure you have downloaded your files…») → επαναφορά της αρχικής + scroll στην κορυφή.
- Ονόματα αρχείων: προσωρινά σταθερά στο `src/lib/files.ts` (`INFO_Generation.docx`, `Gantt_Chart.xlsx`, `KPI_Monitoring.xlsx`, `GA_Exporter_files.zip`), μέχρι να οριστούν από το backend (βλ. «Προς επιβεβαίωση»).
- Mock: `GET /download/{id}/{type}` και `GET /download-all/{id}` επιστρέφουν **πραγματικά** .docx/.xlsx/.zip (βιβλιοθήκη `fflate`), με το ίδιο περιεχόμενο με τα previews (τα .xlsx έχουν τα ίδια sheets). Headers: `Content-Type` + `Content-Disposition: attachment`. 409 αν δεν είναι έτοιμα, 404 για άγνωστο id/τύπο.
- Δοκιμασμένα: headers και κωδικοί σφάλματος των endpoints, εγκυρότητα των αρχείων (δομή zip + έγκυρο XML, σωστά sheets/περιεχόμενο), links στις κάρτες, confirm (Cancel / Yes) και επαναφορά. Lint + TypeScript καθαρά.
- Τσεκαρίστηκαν στο plan: D (3/3). Σύνολο frontend: **17/20** — απομένει μόνο το F.
- **Επόμενο βήμα:** F — logo → αρχική (με confirm), σελίδα Privacy Policy, link στο footer.

### 2026-09-25 — Αποφάσεις 5 & 6: πολλά sheets + επιλογή B ✅
- **Πολλά sheets (απόφαση 5):** νέοι τύποι `SheetPreview` / `WorkbookPreview` (`types.ts`), mock με sheets όπως τα δείγματα (Gantt: M1-M36 Overview / Deliverables' List / Milestones' List · KPI: Online Channels / Publications / Events Count), `ExcelViewer` με καρτέλες (κλικ + βελάκια πληκτρολογίου).
- **Επιλογή B (απόφαση 6):** νέο `ResultsSection` + `FileCard` (αντί για `PreviewSection` + `PreviewCard`). Μετά το `done`: banner «Your analysis is complete…» + 3 κάρτες με **Preview**. Το preview φορτώνεται μόνο στο πρώτο άνοιγμα (1 κλήση για όλα), με loading / σφάλμα + Retry μέσα στο modal.
- Καταργήθηκαν: κουμπί Confirm, σελίδα `src/app/result`, `PreviewCard`, `PreviewSection`.
- Μηνύματα: «Generating files...» / «Files generated successfully.» (αντί για «previews»). Κείμενο οδηγού βήμα 3 ενημερώθηκε.
- Κοινός ορισμός των 3 αρχείων: `src/lib/files.ts`.
- Ενημερώθηκαν: `implementation-plan.md` (§1, §2, §3, backend H, frontend A/C/D/F, §6), αυτό το αρχείο, `frontend/README.md`.
- Δοκιμασμένα στον browser: κάρτες μετά το `done`, καμία κλήση `/preview` πριν το Preview, καρτέλες sheets (κλικ/βελάκια/wrap), 1 κλήση για όλα τα previews, σφάλμα + Retry στο modal. Lint + build καθαρά.
- **Δεν άλλαξαν** (αρχικά έγγραφα προδιαγραφών): `Frontend Description.docx`, `3.png`/`4.png`, mockup `index.html` — σημειώθηκαν με ⚠️ στις «Πηγές».
- **Επόμενο βήμα:** D — Download ανά κάρτα, Download all (.zip), Process another Grant Agreement (+ mock download endpoints).

### 2026-09-25 — Βήμα C: Preview (read-only) ✅
- `PreviewSection`: φορτώνει `GET /preview/{id}` όταν έρθει `done`, κάτω από το upload (χωρίς να καθαρίζει η οθόνη). Skeleton κατά τη φόρτωση, μήνυμα σφάλματος + **Retry** αν αποτύχει.
- `PreviewCard` x3 (INFO / Gantt / KPI): εικονίδιο, τίτλος, τύπος αρχείου + πλήθος γραμμών, ζωντανή μικρογραφία του περιεχομένου, κουμπί expand (και κλικ στη μικρογραφία).
- `WordViewer`: HTML από backend → `DOMPurify.sanitize` → `dangerouslySetInnerHTML`, με στυλ εγγράφου (`.doc-preview` στο `globals.css`).
- `ExcelViewer`: read-only `<table>` με sticky header, οριζόντιο scroll, αριθμοί δεξιά.
- `PreviewModal` (Radix Dialog): 90% × 90%, overlay που παγώνει το φόντο, εσωτερικό scroll, «Χ»/Esc κλείνει. Ένα modal για όλα τα previews.
- `PreviewErrorBoundary`: μήνυμα σφάλματος αντί για σπασμένο container (όπως ζητά το docx).
- **Confirm & Proceed** → `/result?requestId=...`.
- Mock: νέο σενάριο `preview-error` (το preview αποτυγχάνει τα πρώτα 20").
- Bug που βρέθηκε και διορθώθηκε: ίδιο React `key` σε `ProgressIndicator` και `PreviewSection` → διπλή μπάρα προόδου.
- Δοκιμασμένα στον browser: φόρτωση previews, modal (μέγεθος, scroll, Esc/Χ), σφάλμα + Retry, Confirm, mobile. Lint + TypeScript καθαρά.
- Τσεκαρίστηκαν στο plan: C (5/5). Σύνολο frontend: 14/17.
- **Εκκρεμεί από το API contract:** τα previews Excel δείχνουν έναν πίνακα ανά αρχείο (όπως το §6). Αν το backend στείλει πολλά sheets (π.χ. Gantt: Overview / Deliverables / Milestones), το `ExcelViewer` θα χρειαστεί καρτέλες.
- **Επόμενο βήμα:** D — Result page: 3 `DownloadCard`, Download all (.zip), Return to Home Page (+ mock download endpoints).
- Προστέθηκε στο `implementation-plan.md` η ενότητα **F** (3 κουτάκια) για τα παρακάτω.
- **Μετά το D — βήμα F (από το mockup):** logo που επιστρέφει στην αρχική με επιβεβαίωση όταν υπάρχει αρχείο (τώρα στο `/` δεν κάνει τίποτα) και σελίδα Privacy Policy + link στο footer.

### 2026-09-25 — Βήμα B: Home page, upload & progress ✅
- Βιβλιοθήκες: `react-dropzone` 20, `lucide-react` (εικονίδια), `@radix-ui/react-dialog` (modals).
- `UploadDropzone`: μόνο ένα PDF, κλειδώνει όσο υπάρχει αρχείο (click/πληκτρολόγιο/drop), toast για λάθος τύπο.
- `FileThumbnail`: όνομα + μέγεθος, «Χ» → `ConfirmDialog` («Remove file?»). Αν τρέχει επεξεργασία, η αφαίρεση την ακυρώνει.
- Κουμπί **Start** → `POST /upload` (FormData). Disabled μέχρι να υπάρχει αρχείο και κατά την επεξεργασία. Μετά από αποτυχία γίνεται «Try again».
- `ProgressIndicator` + hook `useProcessingStatus`: polling ανά 2,5", μήνυμα ανά status, εναλλασσόμενα fallback μηνύματα όταν το status δεν αλλάζει, timeout 90", σφάλμα μετά από 3 συνεχόμενες αποτυχίες δικτύου.
- `HomeIntro` (οδηγός + κάρτες αρχείων από το mockup): φαίνεται μόνο πριν ξεκινήσει η επεξεργασία.
- Error states (plan §5 E): toast για λάθος αρχείο, κόκκινο πλαίσιο για αποτυχία/timeout επεξεργασίας.
- Δοκιμασμένα στον browser: λάθος τύπος, κλείδωμα, κανονική ροή ως `done`, αφαίρεση με επιβεβαίωση, σενάριο `error`, σενάριο `slow` (fallback μηνύματα, timeout ακριβώς στα 90", σταματά το polling). Lint + TypeScript καθαρά.
- Τσεκαρίστηκαν στο plan: B (4/4) και E (2/2).
- **Επόμενο βήμα:** C — Preview: `PreviewCard` x3, `WordViewer` (DOMPurify), `ExcelViewer`, `PreviewModal` 90%, κουμπί Confirm → `/result`.

### 2026-09-25 — Βήμα A: Setup ✅
- Εγκατάσταση Node.js 24 LTS.
- Scaffold **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind CSS 4 + ESLint στο `frontend/` (`src/` dir, alias `@/*`).
- Layout από το mockup: logo (`public/vilabs-logo.png`, link στην αρχική), animated background, footer, γραμματοσειρά Inter (`next/font`).
- Routes: `/` (placeholder) και `/result?requestId=...` (placeholder).
- API layer: `lib/api/types.ts` (contract §6) + `lib/api/client.ts` (upload/status/preview/download URLs).
- Mock backend: `POST /upload`, `GET /status/{id}`, `GET /preview/{id}`, με σενάρια ok / error / slow. Download endpoints θα μπουν στο βήμα D.
- Έλεγχοι: `npm run lint` καθαρό, `npm run build` επιτυχές, όλα τα σενάρια του mock δοκιμασμένα στον browser, έλεγχος σε desktop και mobile.
- Τσεκαρίστηκαν στο `implementation-plan.md` (§5 Frontend A) τα 3 κουτάκια του setup. Κανόνας: αλλάζουμε μόνο την ενότητα frontend του plan.
- **Επόμενο βήμα:** B — Home page: `UploadDropzone` (react-dropzone), μικρογραφία αρχείου με «Χ», κουμπί Start.

### 2026-09-25
- Κλείδωσαν οι αποφάσεις 1–4 (βλ. «Αποφάσεις»): χωρίς edit mode, status όπως το plan, ξεχωριστό `/result`.
- Μετονομασία logo `ViLabs-logo.png` → `vilabs-logo.png`.
- Αντικατάσταση `Frontend Description.docx` και `1.png`–`4.png` με τη **V1** (χωρίς edit mode).
- Στο docx τα status έγιναν όπως το plan: `scanning, extracting, analyzing, generating, done, error`.
- **Επόμενο βήμα:** scaffold Next.js + TypeScript + Tailwind στο `frontend/`, routes `/` και `/result`.

### 2026-09-23
- Clone του repo στο `C:\dev\GA Exporter` (εκτός OneDrive), branch `frontend`, σύνδεση με GitHub.
- Commit του στατικού mockup (`docs/frontend UI UX/index.html` + logo).
- Μελέτη plan / docx / wireframes / mockup → δημιουργία αυτού του αρχείου.
- **Επόμενο βήμα:** scaffold Next.js + TypeScript + Tailwind στο `frontend/`, routes `/` και `/result`. Αναμένεται απόφαση για τις ασυμφωνίες 1–3.
