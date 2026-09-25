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
