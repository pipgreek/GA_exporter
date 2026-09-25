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

## Ημερολόγιο προόδου

Νεότερα πάνω. Ενημερώνεται μετά από κάθε ολοκληρωμένο βήμα.

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
