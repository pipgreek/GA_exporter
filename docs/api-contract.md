# GA Exporter HTTP API Contract v1

This is the canonical contract shared by `backend`, `frontend`, and `llm`. Routes are relative to the backend origin; there is no `/api` or version prefix. JSON is UTF-8. The service is unauthenticated in v1, consistent with the product plan's no-login scope.

## Health

`GET /health` → `200 { "status": "ok" }` when the backend is up.

The frontend calls it when the home page opens and shows a "Service unavailable" screen if it fails, returns anything else, or does not answer within 60 seconds (to allow for a Render free-tier cold start). Implemented in `backend/src/health/health.module.ts`.

## Upload

`POST /upload`

- Request: `multipart/form-data`, exactly one PDF in the field `file`.
- Maximum upload size: 25 MiB. The backend verifies the `%PDF-` file signature; the MIME type supplied by the browser is not trusted.
- Success: `202 Accepted`, JSON `{ "requestId": "<uuid-v4>" }`. Acceptance means the source PDF was stored and the job was queued.
- `400`: missing file or invalid PDF.
- `413`: file larger than 25 MiB.
- `5xx`: storage or queue unavailable.

Source and intermediate paths are implementation details and are not returned to the frontend.

## Processing status

`GET /status/{requestId}`

Success (`200`):

```json
{
  "status": "extracting",
  "progress": 25,
  "message": "Extracting text and tables."
}
```

- `requestId` is the UUID v4 returned by `POST /upload`.
- `status` is one of `scanning`, `extracting`, `analyzing`, `generating`, `done`, `error`. Queue wait time is represented as `scanning` with progress `0` and a queued message; there is no public `queued` status.
- `progress` is an integer from 0 to 100. It is an approximate, monotonic indicator, not a promise of elapsed time.
- `message` is a non-empty, user-displayable English string. The frontend may use a local fallback if it is absent.
- `done` means all three final files and preview data are available. PDF-to-Markdown completion alone is not `done`.
- `error` is terminal for the request. The response does not expose stack traces or provider credentials.
- `404`: unknown or expired request.

Status/job records and temporary files are retained for at most 24 hours. They may become unavailable earlier due to capacity cleanup. The storage cleanup implementation must honor the 24-hour maximum.

## Preview

`GET /preview/{requestId}` returns `200` only after status is `done`:

```json
{
  "info": { "html": "<h1>Project</h1>" },
  "gantt": {
    "sheets": [
      { "name": "M1-M24 Overview", "headers": ["", "M1"], "rows": [["WP1", "WP"]] }
    ]
  },
  "kpi": {
    "sheets": [
      { "name": "EXPECTED OUTCOME #1", "headers": ["Target", "Achieved", "M1"], "rows": [["tbd", "", ""]] }
    ]
  }
}
```

Excel previews use `{ sheets: [{ name, headers, rows }] }`, in workbook order. Each cell is `string | number | null`. This follows the frontend types and `llm/schemas/preview-mapping.md`.

- `409`: processing is not done yet.
- `404`: unknown or expired request.

## Downloads

All download endpoints return `Content-Disposition: attachment; filename="..."`. This header is authoritative, including for cross-origin frontend requests.

| Route | Type | Filename | Content-Type |
|---|---|---|---|
| `GET /download/{requestId}/info` | Word | `INFO_Generation.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `GET /download/{requestId}/gantt` | Excel | `Gantt_Chart.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `GET /download/{requestId}/kpi` | Excel | `KPI_Monitoring.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `GET /download-all/{requestId}` | ZIP | `GA_Exporter_files.zip` | `application/zip` |

- `409`: requested files are not ready.
- `404`: unknown/expired request or unsupported file type.

## Errors

For JSON errors, `message` is required and is a string. NestJS may include additional fields such as `statusCode` and `error`; clients must depend only on `message`. Internal stack traces and secrets are never part of the public response.

## Browser access and CORS

The browser frontend calls the backend directly. Local development uses frontend `http://localhost:3000` and backend `http://localhost:3001`. CORS allows only origins listed in backend `CORS_ORIGINS`, as a comma-separated allowlist. Its local default is `http://localhost:3000`; production must configure the deployed Vercel origin. Set frontend `NEXT_PUBLIC_API_URL=http://localhost:3001` locally. Credentials/cookies are not used.

## Cancellation and lifecycle

V1 has no cancel endpoint. Removing/resetting the file in the frontend abandons the current UI flow but does not cancel a queued/running backend job. All request data is temporary and must be deleted within 24 hours.
