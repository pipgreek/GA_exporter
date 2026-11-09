import { Module } from '@nestjs/common';
import { DocumentGenerationModule } from '../document-generation/document-generation.module';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { McpController } from './mcp.controller';
import { McpTokenGuard } from './mcp-token.guard';
import { McpToolsService } from './mcp-tools.service';

@Module({
  imports: [StorageModule, DocumentGenerationModule],
  controllers: [McpController],
  providers: [McpToolsService, McpTokenGuard],
})
export class McpModule {}
