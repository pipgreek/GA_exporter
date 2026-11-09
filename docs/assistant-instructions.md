# GA Exporter — assistant setup (Ariadne)

How to connect the GA Exporter to an AI assistant that has its own LLM (Claude Haiku 4.5).
The assistant does the extraction itself; the GA Exporter provides the PDF text, the schemas,
the validation and the file generation through an MCP server.

## 1. Server settings (Add Server form)

| Field | Value |
|---|---|
| Server Name | `GA Exporter` |
| Server Path | `https://<your-render-host>/mcp` (e.g. `https://ga-exporter.onrender.com/mcp`) |
| Auth Token | the value of `MCP_AUTH_TOKEN` set on Render |
| Status | Active |

Render environment variables to add (never commit them):

- `MCP_AUTH_TOKEN` — a long random secret (at least 24 characters). **Unset = the /mcp endpoint is disabled.**
- `PUBLIC_BASE_URL` — the public address of the app, e.g. `https://ga-exporter.onrender.com`. It is used for the download links the assistant gives to the user.

The endpoint answers plain JSON over HTTP POST (MCP Streamable HTTP, stateless). It is
not behind the web login; the bearer token is its only protection.

## 2. How a user works with it

1. Open `https://<host>/assistant` (log in if asked), upload the Grant Agreement PDF.
2. Copy the code shown when it is ready (valid for 24 hours).
3. Tell the assistant: "Process this Grant Agreement, code: `<code>`".
4. The assistant returns three links (INFO Word, Gantt Excel, KPI Excel, plus a zip).
   The links open after logging in to the GA Exporter.

## 3. Tools exposed by the server

| Tool | Purpose |
|---|---|
| `get_markdown(code, part)` | The Grant Agreement text (tables included) in numbered parts of ≤ ~40,000 characters. |
| `get_instructions(type)` | Extraction instructions + exact JSON schema for `info`, `gantt` or `kpi`. |
| `validate_extraction(type, data)` | Schema check, no files created. Lists the exact problems. |
| `render_documents(code, info, gantt, kpi)` | Validates all three, creates the files, returns download links. Can be called again to replace them. |

## 4. System prompt for the assistant (paste into the assistant's Instructions)

```
You turn an EU Grant Agreement into three files (INFO Word, Gantt Excel, KPI Excel) using the
"GA Exporter" tools. Reply in the language the user writes in.

When the user gives you a code, do exactly this, in order:

1. Call get_markdown with part=1, then part=2, ... up to the last part. Read ALL parts before you
   extract anything. Never guess content you have not read.
2. Call get_instructions for "info", for "gantt" and for "kpi". Follow each set of instructions
   literally. They tell you how to fill every field and which value to use when the Grant
   Agreement does not say ("tbd"). Do not invent data.
3. Build one JSON object per output that matches its schema exactly (no extra properties).
4. Call validate_extraction for each one. If it reports problems, fix exactly those and validate
   again. Do not call render_documents until all three are valid.
5. Call render_documents with the code and the three JSON objects. If it reports a problem, fix
   it and call it again.
6. Give the user the download links exactly as returned, and remind them to review the files
   before using them, because the content is generated automatically.

If the user has not given a code, ask them to upload the Grant Agreement on the GA Exporter
"/assistant" page and send you the code it shows. If a tool says the code is missing or expired,
ask for a new one. Never ask for or accept the PDF itself in the chat. Never show or share the
server's token.
```

## 5. Things to check on the first real run

- Whether the assistant's context fits the seven or so `get_markdown` parts plus the three JSON
  outputs (the Gantt JSON alone can be ~16,000 tokens). If it does not, the part size
  (`MAX_PART_CHARS` in `backend/src/mcp/mcp-tools.service.ts`) can be lowered, or the three outputs
  can be done in separate conversations with the same code.
- Whether the assistant stays within its own output limit for the Gantt JSON.
- On Render free the service sleeps after 15 minutes without requests; the first call after that
  can take about a minute and may hit the assistant's request timeout. Retrying works.
