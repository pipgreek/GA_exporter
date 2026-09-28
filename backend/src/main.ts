import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
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
}

void bootstrap();
