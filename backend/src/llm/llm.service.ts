import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { GanttJson, GanttSchema } from './schemas/gantt.schema';
import { InfoJson, InfoSchema } from './schemas/info.schema';
import { KpiJson, KpiSchema } from './schemas/kpi.schema';
import { defaultPromptsDir, LlmRequestPackage, loadRequestPackages, RequestPackageName } from './request-packages';

export class LlmValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'LlmValidationError';
  }
}

export interface LlmExtractionResult {
  info: InfoJson;
  gantt: GanttJson;
  kpi: KpiJson;
}

const SCHEMAS: Record<RequestPackageName, z.ZodTypeAny> = {
  info: InfoSchema,
  gantt: GanttSchema,
  kpi: KpiSchema,
};

const DEFAULT_MAX_RETRIES = 2;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private client?: Anthropic;

  constructor(private readonly config: ConfigService) {}

  /** Runs the three generate<Name>Json() extractions in parallel (implementation-plan.md §5.D). */
  async generateAll(markdown: string): Promise<LlmExtractionResult> {
    const [info, gantt, kpi] = await Promise.all([
      this.generate('info', markdown),
      this.generate('gantt', markdown),
      this.generate('kpi', markdown),
    ]);
    return { info: info as InfoJson, gantt: gantt as GanttJson, kpi: kpi as KpiJson };
  }

  generateInfoJson(markdown: string): Promise<InfoJson> {
    return this.generate('info', markdown) as Promise<InfoJson>;
  }

  generateGanttJson(markdown: string): Promise<GanttJson> {
    return this.generate('gantt', markdown) as Promise<GanttJson>;
  }

  generateKpiJson(markdown: string): Promise<KpiJson> {
    return this.generate('kpi', markdown) as Promise<KpiJson>;
  }

  /**
   * Calls the Anthropic API for one output type and validates the tool_use
   * result against the matching Zod schema, retrying on either a transport
   * error or a schema validation failure. Throws once retries are exhausted
   * (implementation-plan.md §5.E) — the caller (the PDF processing job) lets
   * this propagate so the job/status ends up in the `error` state.
   */
  private async generate(name: RequestPackageName, markdown: string): Promise<unknown> {
    const pkg = this.loadPackage(name);
    const schema = SCHEMAS[name];
    const maxRetries = this.config.get<number>('LLM_MAX_RETRIES') ?? DEFAULT_MAX_RETRIES;
    const maxAttempts = 1 + maxRetries;

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const raw = await this.callAnthropic(pkg, markdown);
        const result = schema.safeParse(raw);
        if (result.success) {
          return result.data;
        }
        lastError = new LlmValidationError(
          `${pkg.tool_choice.name} output failed schema validation: ${result.error.message}`,
          result.error.issues,
        );
        this.logger.warn(
          `LLM validation failed for "${name}" (attempt ${attempt}/${maxAttempts}): ${result.error.message}`,
        );
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `LLM call failed for "${name}" (attempt ${attempt}/${maxAttempts}): ${(error as Error).message}`,
        );
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`LLM extraction for "${name}" failed after ${maxAttempts} attempts.`);
  }

  private async callAnthropic(pkg: LlmRequestPackage, markdown: string): Promise<unknown> {
    const userContent = pkg.user_message.content.replace('{{grant_agreement_markdown}}', markdown);
    // pkg.tools/tool_choice are loaded from llm/prompts/*.request.json at runtime (already
    // shaped correctly, e.g. input_schema.type is always "object") — the SDK's own tool
    // types are stricter than our JSON-loader's Record<string, unknown>, so we assert here
    // rather than hand-duplicating the SDK's input_schema type.
    const response = await this.getClient().messages.create({
      model: pkg.model,
      max_tokens: pkg.max_tokens,
      system: pkg.system,
      tools: pkg.tools as unknown as Anthropic.Tool[],
      tool_choice: pkg.tool_choice as Anthropic.ToolChoice,
      messages: [{ role: pkg.user_message.role, content: userContent }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      throw new Error(`The model did not return a tool_use block (stop_reason: ${response.stop_reason}).`);
    }
    return toolUse.input;
  }

  private loadPackage(name: RequestPackageName): LlmRequestPackage {
    const promptsDir = this.config.get<string>('LLM_PROMPTS_DIR') || defaultPromptsDir();
    return loadRequestPackages(promptsDir)[name];
  }

  private getClient(): Anthropic {
    if (this.client) return this.client;
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Anthropic API is not configured (ANTHROPIC_API_KEY missing).');
    }
    this.client = new Anthropic({ apiKey });
    return this.client;
  }
}
