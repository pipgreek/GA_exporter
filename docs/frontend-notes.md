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

## Ασυμφωνίες — προς απόφαση

| # | Θέμα | Plan | Description / mockup | Πρόταση |
|---|---|---|---|---|
| 1 | Edit mode (μολυβάκι) | «Χωρίς inline editing» | Το docx και το `3.png` το περιλαμβάνουν | Εκτός scope προς το παρόν |
| 2 | Ονόματα status | `scanning`, `extracting`, `analyzing`, `generating`, `done`, `error` | Το docx γράφει `extracting_text`, `analyzing_data`, `generating_preview` | Ακολουθούμε το plan (§6) |
| 3 | Result page | Ξεχωριστό route `/result` | Το mockup είναι single-page (hide/show) | Ξεχωριστό route, με το design του mockup |
| 4 | Logo | — | Το mockup ζητά `vilabs-logo.png`, το αρχείο είναι `ViLabs-logo.png` | Ενιαίο όνομα σε lowercase (case-sensitive στο Vercel) |
