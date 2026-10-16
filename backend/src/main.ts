import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const corsOrigins = app.get(ConfigService)
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    // The frontend reads the download filename off this header cross-origin
    // (docs/api-contract.md: "This header is authoritative, including for
    // cross-origin frontend requests") — without exposedHeaders, the browser
    // still downloads the file fine via a direct link, but JS fetch() can't
    // read Content-Disposition at all.
    exposedHeaders: ['Content-Disposition'],
    credentials: false,
  });

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');

  // Diagnostics for memory-limited hosts: whole-container usage (includes the Python parser)
  // next to this process's heap/rss, every 5s, only while something above 150MB is going on.
  if (process.env.MEMORY_LOG === '1') {
    const mb = (bytes: number) => Math.round(bytes / 1048576);
    const containerBytes = (): number | undefined => {
      for (const file of ['/sys/fs/cgroup/memory.current', '/sys/fs/cgroup/memory/memory.usage_in_bytes']) {
        try { return Number(readFileSync(file, 'utf8').trim()); } catch { /* not on this host */ }
      }
      return undefined;
    };
    setInterval(() => {
      const total = containerBytes();
      const usage = process.memoryUsage();
      if (total !== undefined && mb(total) < 150) return;
      console.log(`[mem] container=${total === undefined ? 'n/a' : mb(total)}MB nest-rss=${mb(usage.rss)}MB heap=${mb(usage.heapUsed)}MB`);
    }, 5000).unref();
  }
}

void bootstrap();
