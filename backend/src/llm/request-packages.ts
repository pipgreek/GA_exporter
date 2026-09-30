import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface LlmRequestPackage {
  model: string;
  max_tokens: number;
  system: string;
  tools: AnthropicToolDefinition[];
  tool_choice: { type: 'tool'; name: string };
  user_message: { role: 'user'; content: string };
}

export type RequestPackageName = 'info' | 'gantt' | 'kpi';

const PACKAGE_NAMES: readonly RequestPackageName[] = ['info', 'gantt', 'kpi'];

// backend/src/llm (dev, ts-node) or backend/dist/llm (build) are both exactly
// two levels under backend/, so this resolves to the repo-root llm/prompts/
// directory the same way in both cases.
export function defaultPromptsDir(): string {
  return join(__dirname, '..', '..', '..', 'llm', 'prompts');
}

const cache = new Map<string, Record<RequestPackageName, LlmRequestPackage>>();

export function loadRequestPackages(promptsDir: string): Record<RequestPackageName, LlmRequestPackage> {
  const cached = cache.get(promptsDir);
  if (cached) return cached;

  const loaded = {} as Record<RequestPackageName, LlmRequestPackage>;
  for (const name of PACKAGE_NAMES) {
    const raw = readFileSync(join(promptsDir, `${name}.request.json`), 'utf8');
    loaded[name] = JSON.parse(raw) as LlmRequestPackage;
  }
  cache.set(promptsDir, loaded);
  return loaded;
}
