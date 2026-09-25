# Frontend — Σημειώσεις & ανοιχτά σημεία

Συμπληρωματικό του [Implementation Plan](implementation-plan.md) (§5 Frontend, §6 API contract). Υπεύθυνη: Θεοδώρα.

## Πηγές προδιαγραφών

| Αρχείο | Τι περιέχει |
|---|---|
| [implementation-plan.md](implementation-plan.md) | Tasks frontend (§5) και το κοινό API contract με το backend (§6) |
| `Frontend Description.docx` | Αναλυτική περιγραφή UX και τεχνικών επιλογών (hooks, polling, modal) |
| `1.png` – `4.png` | Wireframes: αρχική, upload/progress, previews, result |
| [frontend UI UX/index.html](frontend%20UI%20UX/index.html) | Στατικό mockup (Tailwind) — αναφορά για το τελικό design |

## Τι πρέπει να υλοποιηθεί

1. **`/` — Upload:** dropzone μόνο για PDF, κλειδώνει μετά το upload· μικρογραφία αρχείου με «Χ» (ξεκλειδώνει)· **Start** disabled μέχρι upload → `POST /upload` (FormData).
2. **Progress:** polling `GET /status/{requestId}` ανά 2–3", progress bar + μήνυμα ανά status, fallback rotation μηνυμάτων όταν το status δεν αλλάζει, timeout 90".
3. **Preview:** 3 κάρτες (INFO/Word, Gantt/Excel, KPI/Excel) κάτω από το upload χωρίς να καθαρίζει η οθόνη. Word = HTML από backend + `DOMPurify.sanitize`· Excel = read-only πίνακας από `{headers, rows}`. Modal 90% με εσωτερικό scroll και «Χ».
4. **Confirm** → `/result?requestId=...`: 3 κάρτες με Download, **Download all (.zip)**, **Return to Home Page**.
5. **Error states:** λάθος τύπος αρχείου, αποτυχία/timeout επεξεργασίας.

Μέχρι να είναι έτοιμο το backend, το frontend δουλεύει με **mock data** πάνω στο contract του §6.

## Στοιχεία από το mockup

Logo ViLabs (επιστροφή στην αρχική), animated background, toast για σφάλματα, confirm modals (διαγραφή αρχείου, επιστροφή στην αρχική, μετάβαση στο Privacy Policy), σελίδα Privacy Policy, footer.

## Αποφάσεις (2026-09-25)

Όπου το `Frontend Description.docx` / τα wireframes διαφέρουν από το plan, **υπερισχύει το plan**.

| # | Θέμα | Απόφαση |
|---|---|---|
| 1 | Edit mode (μολυβάκι) | **Αφαιρείται.** Τα previews είναι αυστηρά read-only, όπως ορίζει το plan. Κανένα εικονίδιο/λειτουργία επεξεργασίας. (Αφαιρέθηκε και από το docx / `3.png` στη V1.) |
| 2 | Ονόματα status | **Όπως το plan (§6):** `scanning` → `extracting` → `analyzing` → `generating` → `done` \| `error`. (Διορθώθηκε και στο docx.) |
| 3 | Result page | **Ξεχωριστό route `/result?requestId=...`**, με το design του mockup. |
| 4 | Logo | **Μετονομάστηκε σε `vilabs-logo.png`** (lowercase, ταιριάζει με το mockup, ασφαλές σε case-sensitive hosting όπως το Vercel). |

Αντιστοίχιση status → μήνυμα UI:

| status | Μήνυμα |
|---|---|
| `scanning` | Scanning Grant Agreement... |
| `extracting` | Extracting text and structure... |
| `analyzing` | Analyzing Work Packages and KPIs... |
| `generating` | Generating previews... |
| `done` | Previews generated successfully. |
| `error` | Error state (βλ. Error states) |

## Mock backend (μέχρι να στηθεί το πραγματικό)

Το frontend δεν έχει ακόμα πρόσβαση σε API. Γι' αυτό υπάρχει **mock backend μέσα στο Next.js** (`frontend/src/app/api/mock`), με τα ίδια endpoints/σχήματα με το contract §6. Όλες οι κλήσεις περνούν από το `frontend/src/lib/api/client.ts`:

- `NEXT_PUBLIC_API_URL` κενό → mock (`/api/mock/*`)
- `NEXT_PUBLIC_API_URL=<url backend>` → πραγματικό backend, **χωρίς αλλαγή κώδικα**

Σενάρια (από το όνομα του PDF): κανονικό (~15"), `error` (αποτυχία στο `analyzing`), `slow` (κολλάει στο `analyzing` → έλεγχος timeout 90"). Λεπτομέρειες στο `frontend/README.md`.

## Προς επιβεβαίωση με το backend

Υποθέσεις που κάναμε στο `frontend/src/lib/api/types.ts` επειδή το §6 δεν τις ορίζει:

- Όνομα πεδίου του PDF στο `POST /upload`: `file`.
- `rows` των Excel previews: πίνακας γραμμών με τιμές `string | number | null`.
- Σφάλματα: HTTP 4xx/5xx με σώμα `{ message }`.
- CORS: το backend πρέπει να επιτρέπει το origin του frontend (Vercel + `localhost:3000`).

## Ημερολόγιο προόδου

Νεότερα πάνω. Ενημερώνεται μετά από κάθε ολοκληρωμένο βήμα.

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
