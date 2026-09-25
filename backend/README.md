# GA Exporter Backend

Owners: pipgreek and Γιώργος.

NestJS API and processing infrastructure for GA Exporter. The project currently contains the application scaffold, configuration validation, the `ga-export` BullMQ queue on Redis, a Supabase Storage adapter, an internal PDF processing worker, and the upload/status endpoints from the implementation plan.

## Requirements

- Node.js 20.19 or later
- Python 3.10 or later with `requirements.txt` installed
- pnpm 11.25.0
- Docker Desktop for local Redis

The backend uses TypeScript 5.9.3 to match the frontend toolchain. It uses NestJS 11, which supports that TypeScript version. The frontend framework and styling packages remain separate; the API contract will define compatibility between the two applications.

## Local development

From this directory:

```powershell
pnpm install
python -m pip install -r requirements.txt
Copy-Item .env.example .env
docker compose up -d redis
pnpm start:dev
```

The liveness endpoint is `GET http://localhost:3000/health`.

### Processing API

- `POST /upload` — send a PDF as `multipart/form-data` using the field name `file`. Returns `202 Accepted` with `{ "requestId": "<uuid>" }` after the PDF is stored and queued.
- `GET /status/{requestId}` — returns `{ "status": "scanning|extracting|analyzing|generating|done|error", "progress": 0, "message": "..." }`. The request ID must be a UUID v4. Status is retained for `JOB_RETENTION_SECONDS` (default 24 hours).

The current worker implements the `scanning` and `extracting` stages. LLM analysis and output generation are subsequent pipeline stages. Preview/download endpoints are not implemented yet.

`PdfParserService.extractToMarkdown()` accepts PDF bytes and invokes the bundled `pdfplumber` helper. It preserves page boundaries and emits detected tables as Markdown. Set `PDF_PYTHON_EXECUTABLE` if Python is not available as `python` (Windows) or `python3` (Linux/macOS). Scanned pages are marked as having no extractable text; OCR is not included in this first parser pass.

`POST /upload` stores the source PDF under `<requestId>/input/original.pdf` and enqueues a processing job. The worker downloads it, extracts Markdown, uploads the intermediate file under `<requestId>/intermediate/grant-agreement.md`, and stores structured progress in BullMQ/Redis. Completed and failed job records are retained for `JOB_RETENTION_SECONDS` (default 86400) for status access.

Local Redis listens on `127.0.0.1:6379`. For Upstash, set `REDIS_URL` to the TLS `rediss://` connection URL. Supabase Storage is configured with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`. The service role key must remain server-side and must not be committed or exposed to the frontend. The bucket must exist in Supabase before uploads are enabled.

Copy real credentials only into the ignored `.env` file. `.env.example` contains placeholders and is safe to commit.
