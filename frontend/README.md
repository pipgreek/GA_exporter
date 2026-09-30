# Frontend

Υπεύθυνη: Θεοδώρα

Next.js 16 (App Router) + React + TypeScript + Tailwind CSS 4.
Σημειώσεις, αποφάσεις και πρόοδος: [docs/frontend-notes.md](../docs/frontend-notes.md).

## Εκκίνηση

```bash
npm install
npm run dev
```

Η εφαρμογή ανοίγει στο http://localhost:3000.

| Εντολή | Τι κάνει |
|---|---|
| `npm run dev` | Dev server με hot reload |
| `npm run build` | Production build (ελέγχει και τους τύπους) |
| `npm run lint` | ESLint |

## Σύνδεση με το backend

Όλες οι κλήσεις περνούν από το [`src/lib/api/client.ts`](src/lib/api/client.ts), με τους τύπους στο [`src/lib/api/types.ts`](src/lib/api/types.ts). Το canonical v1 contract είναι στο [`../docs/api-contract.md`](../docs/api-contract.md) (implementation plan §6).

Η εφαρμογή συνδέεται **πάντα** με το backend του `NEXT_PUBLIC_API_URL` ([`src/lib/api/config.ts`](src/lib/api/config.ts)) — **δεν υπάρχει demo mode**. Στο άνοιγμα της αρχικής, το [`BackendGate`](src/components/home/BackendGate.tsx) καλεί `GET /health`:

| Κατάσταση | Τι βλέπει ο χρήστης |
|---|---|
| Το backend απαντά `{ status: "ok" }` | Κανονικά την εφαρμογή |
| Αναμονή απάντησης | «Connecting to the server...»· μετά από 5" και «The server is starting up…» (Render free tier) |
| Δεν απαντά / σφάλμα / πάνω από 60" / λείπει το `NEXT_PUBLIC_API_URL` | Σελίδα **«Service unavailable»** με κουμπί «Try again» |

Οι μεταβλητές `NEXT_PUBLIC_*` «ψήνονται» στο build — μετά από αλλαγή χρειάζεται νέο build. Ρυθμίσεις: [`.env.example`](.env.example).

### Mock backend (μόνο για ανάπτυξη)

Για δουλειά στο UI χωρίς backend υπάρχει mock στο [`src/app/api/mock`](src/app/api/mock) (λογική στο [`src/mocks/mockBackend.ts`](src/mocks/mockBackend.ts)). **Δεν ενεργοποιείται ποτέ αυτόματα**· χρησιμοποιείται μόνο αν οριστεί ρητά στο `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/mock
```

Λειτουργεί μόνο με `npm run dev`· σε production build τα `/api/mock/*` επιστρέφουν 404.

Για τοπική εκτέλεση, το frontend στο `http://localhost:3000` συνδέεται με backend στο `http://localhost:3001` μέσω `NEXT_PUBLIC_API_URL`.

Το όριο PDF των 25 MiB εφαρμόζεται τόσο στο dropzone όσο και στο mock upload route. `done` σημαίνει ότι είναι έτοιμα και τα τρία outputs και τα preview δεδομένα.

### Σενάρια δοκιμής του mock

Το σενάριο επιλέγεται από το όνομα του PDF που ανεβαίνει:

| Όνομα αρχείου | Αποτέλεσμα |
|---|---|
| οτιδήποτε άλλο | Ολοκληρώνεται σε ~15" (`scanning` → … → `done`) |
| περιέχει `error` | Αποτυγχάνει στο `analyzing` (status `error`) |
| περιέχει `slow` | «Κολλάει» στο `analyzing`, για έλεγχο του timeout 150" και των δικών μας μηνυμάτων (εμφανίζονται μετά από 20" χωρίς αλλαγή) |
| περιέχει `preview-error` | Ολοκληρώνεται, αλλά το `GET /preview` αποτυγχάνει για τα πρώτα 20" (έλεγχος μηνύματος σφάλματος + Retry) |

Το mock δεν κρατά state: το `requestId` περιέχει σενάριο και ώρα έναρξης (`mock_<scenario>_<ms>`).

Τα downloads του mock (`/download/{id}/{type}`, `/download-all/{id}`) είναι πραγματικά αρχεία .docx / .xlsx / .zip που ανοίγουν σε Word/Excel, με το ίδιο περιεχόμενο με τα previews ([`src/mocks/mockFiles.ts`](src/mocks/mockFiles.ts)).

## Δομή

```
src/
  app/
    page.tsx            # / — όλη η ροή: upload → progress → αρχεία (download + προαιρετικό preview)
    privacy/page.tsx    # /privacy — Privacy Policy
    api/mock/...        # mock backend (ίδια endpoints με το contract)
  components/
    home/               # HomeView (ροή της αρχικής), HomeIntro
    upload/             # UploadDropzone, FileThumbnail
    progress/           # ProgressIndicator
    results/            # ResultsSection, FileCard
    preview/            # PreviewModal, WordViewer, ExcelViewer (καρτέλες sheets)
    ui/                 # ConfirmDialog, Toaster
    layout/             # header, footer, background, NavigationGuard (confirm πριν χαθεί δουλειά)
  hooks/                # useProcessingStatus (polling)
  lib/api/              # API client + types (contract)
  lib/files.ts          # ορισμός των 3 παραγόμενων αρχείων
  mocks/                # δεδομένα/λογική του mock backend
```
