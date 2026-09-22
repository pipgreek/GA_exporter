# GA Exporter

Εργαλείο αυτόματης παραγωγής εγγράφων (INFO/Gantt/KPI) από Grant Agreement PDF — VILABS.

Δες το [Implementation Plan](docs/implementation-plan.md) για πλήρη αρχιτεκτονική, τεχνολογική στοίβα και tasks ανά άτομο.

## Ομάδα & Branches

| Branch | Ομάδα | Αντικείμενο |
|---|---|---|
| `main` | — | Ενοποιημένος, σταθερός κώδικας |
| `backend` | pipgreek, Γιώργος | Backend, queue/worker, PDF parsing, LLM integration, templates |
| `frontend` | Θεοδώρα | Frontend / UI |
| `llm` | Αριστείδης | LLM prompts & JSON schemas (.md files) |

## Ροή εργασίας

1. Κάθε ομάδα δουλεύει στο δικό της branch.
2. Ανοίγετε PR προς `main` όταν το κομμάτι σας είναι έτοιμο.
3. Γίνεται review πριν το merge στο `main`.
