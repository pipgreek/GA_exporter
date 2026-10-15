// Ad-hoc dev utility: runs the real PDF->Markdown->LLM->render pipeline
// against a local PDF and writes the 3 output files to a local folder,
// bypassing Supabase/Redis/the queue entirely (useful when cloud storage is
// unreachable, or for a quick one-off local check). Not part of the server.
//
// Usage: pnpm ts-node scripts/run-pipeline-local.ts "<path-to.pdf>" "<out-dir>"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PdfParserService } from '../src/pdf-parsing/pdf-parser.service';
import { LlmService } from '../src/llm/llm.service';
import { DocumentGenerationService } from '../src/document-generation/document-generation.service';

// Minimal stand-in for NestJS's ConfigService (just the two methods these
// services actually call), backed directly by process.env — loaded from
// backend/.env below since this script runs outside the normal Nest
// bootstrap (ConfigModule) that would otherwise read it.
class EnvConfig {
  get<T = string>(key: string): T | undefined {
    const v = process.env[key];
    return (v === undefined || v === '' ? undefined : v) as unknown as T | undefined;
  }
  getOrThrow<T = string>(key: string): T {
    const v = this.get<T>(key);
    if (v === undefined) throw new Error(`Missing required env var: ${key}`);
    return v;
  }
}

function loadDotEnv(path: string): void {
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  const [, , pdfPathArg, outDirArg] = process.argv;
  if (!pdfPathArg || !outDirArg) {
    throw new Error('Usage: run-pipeline-local.ts "<path-to.pdf>" "<out-dir>"');
  }

  loadDotEnv(join(__dirname, '..', '.env'));
  const config = new EnvConfig() as any;

  const outDir = outDirArg;
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  console.log('1/3 Parsing PDF to Markdown...');
  const pdfParser = new PdfParserService(config);
  const pdfBytes = readFileSync(pdfPathArg);
  const markdown = await pdfParser.extractToMarkdown(pdfBytes);
  writeFileSync(join(outDir, 'grant-agreement.md'), markdown, 'utf8');
  console.log(`   -> ${markdown.length} chars`);

  console.log('2/3 Calling the Anthropic API (info/gantt/kpi, in parallel)...');
  const llm = new LlmService(config);
  const extraction = await llm.generateAll(markdown);
  writeFileSync(join(outDir, 'info.output.json'), JSON.stringify(extraction.info, null, 2), 'utf8');
  writeFileSync(join(outDir, 'gantt.output.json'), JSON.stringify(extraction.gantt, null, 2), 'utf8');
  writeFileSync(join(outDir, 'kpi.output.json'), JSON.stringify(extraction.kpi, null, 2), 'utf8');
  console.log('   -> extraction validated against Zod schemas OK');

  console.log('3/3 Rendering Word/Excel files...');
  const docGen = new DocumentGenerationService();
  const generated = await docGen.generateAll(extraction);
  writeFileSync(join(outDir, 'INFO_Generation.docx'), generated.infoDocx);
  writeFileSync(join(outDir, 'Gantt_Chart.xlsx'), generated.ganttXlsx);
  writeFileSync(join(outDir, 'KPI_Monitoring.xlsx'), generated.kpiXlsx);

  console.log('Done. Wrote to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
