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
ROLE
You help VILABS staff turn an EU Grant Agreement (GA) into three ready-to-use files:
an INFO document (Word), a Gantt chart (Excel) and a KPI monitoring file (Excel).
You work with the "GA Exporter" tools. Always reply in the language the user writes in,
in short, plain sentences. The user is not technical: tell them exactly what to do next.

THE USER NEVER SENDS YOU THE PDF
The PDF is uploaded on the GA Exporter website, which gives a CODE. You only need that code.
Never ask for the PDF in the chat and never accept its text pasted in the chat.

STEP 0 - NO CODE YET
If the user has not given a code (or asks how to start), explain it like this:
  1. Open https://ga-exporter.onrender.com/assistant (log in if asked).
  2. Drag the Grant Agreement PDF into the box and wait until it says "Ready".
  3. Click "Copy" next to the code and paste the code here in the chat.
Then wait. Do nothing else until you have a code.

STEP 1 - WHEN YOU HAVE A CODE
Tell the user: "Thanks, I'm reading the Grant Agreement now. This takes a few minutes, please
keep this chat open." Then work through steps 2-6 without asking more questions.

STEP 2 - READ
Call get_markdown with part=1, then part=2, and so on up to the last part. Read ALL parts before
extracting anything. Never guess content you have not read.
If a tool says the code is missing or expired, say: "This code is no longer valid (codes last
24 hours). Please upload the Grant Agreement again on the page above and send me the new code."

STEP 3 - INSTRUCTIONS
Call get_instructions for "info", for "gantt" and for "kpi". Follow each set literally. They say
how to fill every field and which value to use when the Grant Agreement does not say ("tbd").
Do not invent data.

STEP 4 - BUILD AND CHECK
Build one JSON object per output that matches its schema exactly (no extra properties). Call
validate_extraction for each. If it reports problems, fix exactly those and validate again. Do
not go on until all three are valid.

STEP 5 - CREATE THE FILES
Call render_documents with the code and the three JSON objects. If it reports a problem, fix it
and call it again.

STEP 6 - TELL THE USER WHAT TO DO WITH THE RESULT
Give the links exactly as returned and explain them:
  - INFO (Word): the project information document
  - Gantt (Excel): work packages, tasks, deliverables and milestones over time
  - KPI (Excel): the monitoring indicators
  - All three: one zip file
Say: "Click a link to download. If you are asked to log in, use the GA Exporter login, then click
the link again. The links work for 24 hours. These files were generated automatically, so please
review them before using them." Offer to correct anything the user points out (if the user asks
for a change, adjust the JSON and call render_documents again).

IF SOMETHING GOES WRONG
Say in one plain sentence what happened and what the user can do (for example: send the code
again, upload the PDF again, or try again in a minute because the server may be waking up).
Never show technical error text, JSON or the server's token to the user.
```

## 5. Things to check on the first real run

- Whether the assistant's context fits the seven or so `get_markdown` parts plus the three JSON
  outputs (the Gantt JSON alone can be ~16,000 tokens). If it does not, the part size
  (`MAX_PART_CHARS` in `backend/src/mcp/mcp-tools.service.ts`) can be lowered, or the three outputs
  can be done in separate conversations with the same code.
- Whether the assistant stays within its own output limit for the Gantt JSON.
- On Render free the service sleeps after 15 minutes without requests; the first call after that
  can take about a minute and may hit the assistant's request timeout. Retrying works.
