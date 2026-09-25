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

## Backend: mock ή πραγματικό

Όλες οι κλήσεις περνούν από το [`src/lib/api/client.ts`](src/lib/api/client.ts), με τους τύπους του API contract στο [`src/lib/api/types.ts`](src/lib/api/types.ts) (implementation plan §6).

- **Χωρίς `NEXT_PUBLIC_API_URL`** → χρησιμοποιείται το ενσωματωμένο mock backend στο `/api/mock/*` ([`src/app/api/mock`](src/app/api/mock), λογική στο [`src/mocks/mockBackend.ts`](src/mocks/mockBackend.ts)).
- **Με `NEXT_PUBLIC_API_URL`** (στο `.env.local`, βλ. [`.env.example`](.env.example)) → χρησιμοποιείται το πραγματικό backend, χωρίς αλλαγές στον κώδικα.

### Σενάρια δοκιμής του mock

Το σενάριο επιλέγεται από το όνομα του PDF που ανεβαίνει:

| Όνομα αρχείου | Αποτέλεσμα |
|---|---|
| οτιδήποτε άλλο | Ολοκληρώνεται σε ~15" (`scanning` → … → `done`) |
| περιέχει `error` | Αποτυγχάνει στο `analyzing` (status `error`) |
| περιέχει `slow` | «Κολλάει» στο `analyzing`, για έλεγχο του timeout 90" και των fallback μηνυμάτων |
| περιέχει `preview-error` | Ολοκληρώνεται, αλλά το `GET /preview` αποτυγχάνει για τα πρώτα 20" (έλεγχος μηνύματος σφάλματος + Retry) |

Το mock δεν κρατά state: το `requestId` περιέχει σενάριο και ώρα έναρξης (`mock_<scenario>_<ms>`).

## Δομή

```
src/
  app/
    page.tsx            # / — upload, progress, previews, confirm
    result/page.tsx     # /result?requestId=... — downloads
    api/mock/...        # mock backend (ίδια endpoints με το contract)
  components/           # UI components
  lib/api/              # API client + types (contract)
  mocks/                # δεδομένα/λογική του mock backend
```
