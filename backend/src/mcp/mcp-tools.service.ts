import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DocumentGenerationService } from '../document-generation/document-generation.service';
import { SupabaseStorageService } from '../infrastructure/storage/storage.service';
import { defaultPromptsDir, loadRequestPackages, RequestPackageName } from '../llm/request-packages';
import { GanttJson, GanttSchema } from '../llm/schemas/gantt.schema';
import { InfoJson, InfoSchema } from '../llm/schemas/info.schema';
import { KpiJson, KpiSchema } from '../llm/schemas/kpi.schema';
import { OUTPUT_FILES, outputStoragePath, previewStoragePath } from '../processing/output-files';

const SCHEMAS: Record<RequestPackageName, z.ZodTypeAny> = { info: InfoSchema, gantt: GanttSchema, kpi: KpiSchema };

/** One get_markdown part stays below this many characters so it fits an assistant's context comfortably. */
const MAX_PART_CHARS = 40_000;
const PAGE_SEPARATOR = '\n\n---\n\n';
const MAX_REPORTED_ISSUES = 25;
const EXPIRED = 'This code was not found or has expired (codes are valid for 24 hours). Ask the user for a new code.';

const CodeSchema = z.string().uuid().describe('The code the user got from the upload page.');
const TypeSchema = z.enum(['info', 'gantt', 'kpi']).describe('Which output: info (Word), gantt (Excel) or kpi (Excel).');
const JsonObject = z.record(z.unknown());

// The SDK's input-schema generics recurse too deeply (TS2589) with our zod build, so the shapes are
// passed untyped and each handler declares its own argument type.
const shape = (fields: Record<string, z.ZodTypeAny>) => fields;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: any) => Promise<ToolResult> | ToolResult;
type RegisterTool = (
  name: string,
  config: { description: string; inputSchema: Record<string, z.ZodTypeAny> },
  handler: ToolHandler,
) => void;

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const ok = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });
const fail = (text: string): ToolResult => ({ content: [{ type: 'text', text }], isError: true });

function describeIssues(error: z.ZodError): string {
  const lines = error.issues
    .slice(0, MAX_REPORTED_ISSUES)
    .map((issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  const more = error.issues.length > MAX_REPORTED_ISSUES ? `\n(+${error.issues.length - MAX_REPORTED_ISSUES} more)` : '';
  return lines.join('\n') + more;
}

/** Groups the markdown's page sections into parts of at most maxChars characters. */
export function splitMarkdownIntoParts(markdown: string, maxChars = MAX_PART_CHARS): string[] {
  const parts: string[] = [];
  let current = '';
  // The parser writes CRLF on Windows; normalise so the page separator matches everywhere.
  for (const section of markdown.replace(/\r\n/g, '\n').split(PAGE_SEPARATOR)) {
    if (current && current.length + section.length + PAGE_SEPARATOR.length > maxChars) {
      parts.push(current);
      current = '';
    }
    current = current ? current + PAGE_SEPARATOR + section : section;
  }
  if (current) parts.push(current);
  return parts.length > 0 ? parts : [''];
}

@Injectable()
export class McpToolsService {
  constructor(
    private readonly config: ConfigService,
    private readonly storage: SupabaseStorageService,
    private readonly documents: DocumentGenerationService,
  ) {}

  /** A fresh server per request (stateless transport). */
  createServer(): McpServer {
    const server = new McpServer({ name: 'ga-exporter', version: '1.0.0' });
    const registerTool = server.registerTool.bind(server) as unknown as RegisterTool;

    registerTool(
      'get_markdown',
      {
        description:
          'Returns the text of the uploaded Grant Agreement (as Markdown, tables included) in numbered parts. ' +
          'Call with part=1, then continue until part equals the total. Read ALL parts before extracting.',
        inputSchema: shape({ code: CodeSchema, part: z.number().int().min(1).optional().describe('1-based part number (default 1).') }),
      },
      async ({ code, part }: { code: string; part?: number }) => this.getMarkdown(code, part ?? 1),
    );

    registerTool(
      'get_instructions',
      {
        description:
          'Returns the extraction instructions and the exact JSON schema for one output (info, gantt or kpi). ' +
          'Follow them literally when you build the JSON for that output.',
        inputSchema: shape({ type: TypeSchema }),
      },
      async ({ type }: { type: RequestPackageName }) => this.getInstructions(type),
    );

    registerTool(
      'validate_extraction',
      {
        description:
          'Checks a JSON object against the schema of one output without creating any files. ' +
          'If it reports problems, fix exactly those and call it again.',
        inputSchema: shape({ type: TypeSchema, data: JsonObject.describe('The JSON object for that output.') }),
      },
      async ({ type, data }: { type: RequestPackageName; data: Record<string, unknown> }) => {
        const result = SCHEMAS[type].safeParse(data);
        return result.success ? ok('Valid.') : fail(`Not valid:\n${describeIssues(result.error)}`);
      },
    );

    registerTool(
      'render_documents',
      {
        description:
          'Validates the three JSON objects and creates the INFO Word file, the Gantt Excel file and the KPI Excel file. ' +
          'Returns download links. Can be called again with corrected JSON; it replaces the earlier files.',
        inputSchema: shape({
          code: CodeSchema,
          info: JsonObject.describe('JSON for the info output.'),
          gantt: JsonObject.describe('JSON for the gantt output.'),
          kpi: JsonObject.describe('JSON for the kpi output.'),
        }),
      },
      async ({ code, info, gantt, kpi }: { code: string; info: Record<string, unknown>; gantt: Record<string, unknown>; kpi: Record<string, unknown> }) => this.renderDocuments(code, { info, gantt, kpi }),
    );

    return server;
  }

  private async readMarkdown(code: string): Promise<string | undefined> {
    try {
      return (await this.storage.download(`${code}/intermediate/grant-agreement.md`)).toString('utf8');
    } catch {
      return undefined;
    }
  }

  private async getMarkdown(code: string, part: number): Promise<ToolResult> {
    const markdown = await this.readMarkdown(code);
    if (markdown === undefined) return fail(EXPIRED);
    const parts = splitMarkdownIntoParts(markdown);
    if (part > parts.length) {
      return fail(`There are only ${parts.length} parts. Ask for a part from 1 to ${parts.length}.`);
    }
    return ok(`[part ${part} of ${parts.length}]\n\n${parts[part - 1]}`);
  }

  private getInstructions(type: RequestPackageName): ToolResult {
    const promptsDir = this.config.get<string>('LLM_PROMPTS_DIR') || defaultPromptsDir();
    const pkg = loadRequestPackages(promptsDir)[type];
    const tool = (pkg.tools as { input_schema?: unknown }[])[0];
    return ok(
      [
        `# Instructions for the "${type}" output`,
        pkg.system,
        '# Output',
        'Produce one JSON object that satisfies this JSON schema exactly (no extra properties). ' +
          'Then call validate_extraction before render_documents.',
        '```json',
        JSON.stringify(tool?.input_schema ?? {}, null, 1),
        '```',
      ].join('\n\n'),
    );
  }

  private async renderDocuments(
    code: string,
    raw: { info: Record<string, unknown>; gantt: Record<string, unknown>; kpi: Record<string, unknown> },
  ): Promise<ToolResult> {
    if ((await this.readMarkdown(code)) === undefined) return fail(EXPIRED);

    const problems: string[] = [];
    const parsed: Partial<Record<RequestPackageName, unknown>> = {};
    for (const type of ['info', 'gantt', 'kpi'] as const) {
      const result = SCHEMAS[type].safeParse(raw[type]);
      if (result.success) parsed[type] = result.data;
      else problems.push(`"${type}" is not valid:\n${describeIssues(result.error)}`);
    }
    if (problems.length > 0) return fail(problems.join('\n\n'));

    const generated = await this.documents.generateAll({
      info: parsed.info as InfoJson,
      gantt: parsed.gantt as GanttJson,
      kpi: parsed.kpi as KpiJson,
    });
    await Promise.all([
      this.storage.upload(outputStoragePath(code, 'info'), generated.infoDocx, OUTPUT_FILES.info.contentType, true),
      this.storage.upload(outputStoragePath(code, 'gantt'), generated.ganttXlsx, OUTPUT_FILES.gantt.contentType, true),
      this.storage.upload(outputStoragePath(code, 'kpi'), generated.kpiXlsx, OUTPUT_FILES.kpi.contentType, true),
      this.storage.upload(
        previewStoragePath(code),
        Buffer.from(JSON.stringify(generated.preview), 'utf8'),
        'application/json',
        true,
      ),
    ]);

    const base = (this.config.get<string>('PUBLIC_BASE_URL') ?? '').replace(/\/+$/, '');
    const link = (path: string) => `${base}/backend${path}`;
    return ok(
      [
        'The files are ready. Give the user these links (they open after logging in to the GA Exporter):',
        `- INFO (Word): ${link(`/download/${code}/info`)}`,
        `- Gantt (Excel): ${link(`/download/${code}/gantt`)}`,
        `- KPI (Excel): ${link(`/download/${code}/kpi`)}`,
        `- All three (zip): ${link(`/download-all/${code}`)}`,
        'The links work for 24 hours from the upload.',
      ].join('\n'),
    );
  }
}
