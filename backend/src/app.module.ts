import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { HealthModule } from './health/health.module';
import { PdfParsingModule } from './pdf-parsing/pdf-parsing.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { ProcessingModule } from './processing/processing.module';
import { LlmModule } from './llm/llm.module';
import { parseRedisConnection } from './infrastructure/queue/redis-connection';

const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).default('redis://127.0.0.1:6379'),
  SUPABASE_URL: Joi.string().uri().allow('').optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow('').optional(),
  SUPABASE_BUCKET: Joi.string().default('ga-exporter'),
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  LLM_PROMPTS_DIR: Joi.string().allow('').optional(),
  LLM_MAX_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  PDF_PYTHON_EXECUTABLE: Joi.string().default(process.platform === 'win32' ? 'python' : 'python3'),
  JOB_RETENTION_SECONDS: Joi.number().integer().min(3600).default(86400),
});

const validationOptions = { abortEarly: false };

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema, validationOptions }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: parseRedisConnection(config.getOrThrow<string>('REDIS_URL')),
      }),
    }),
    QueueModule,
    HealthModule,
    StorageModule,
    PdfParsingModule,
    LlmModule,
    ProcessingModule,
  ],
})
export class AppModule {}
