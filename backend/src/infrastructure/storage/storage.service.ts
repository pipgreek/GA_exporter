import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private client?: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  async upload(path: string, file: Buffer, contentType: string): Promise<string> {
    const bucket = this.config.getOrThrow<string>('SUPABASE_BUCKET');
    const { data, error } = await this.getClient()
      .storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: false });

    if (error) {
      throw new ServiceUnavailableException(`Supabase Storage upload failed: ${error.message}`);
    }
    return data.path;
  }

  async download(path: string): Promise<Buffer> {
    const bucket = this.config.getOrThrow<string>('SUPABASE_BUCKET');
    const { data, error } = await this.getClient().storage.from(bucket).download(path);
    if (error) {
      throw new ServiceUnavailableException(`Supabase Storage download failed: ${error.message}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRoleKey) {
      throw new ServiceUnavailableException('Supabase Storage is not configured.');
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return this.client;
  }
}
