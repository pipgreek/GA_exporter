import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './storage.service';

@Module({ providers: [SupabaseStorageService], exports: [SupabaseStorageService] })
export class StorageModule {}
