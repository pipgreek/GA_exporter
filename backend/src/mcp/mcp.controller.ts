import { Controller, Delete, Get, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { McpTokenGuard } from './mcp-token.guard';
import { McpToolsService } from './mcp-tools.service';

/**
 * MCP over Streamable HTTP, stateless: every POST gets its own server+transport, so there is
 * no session to lose when the host restarts or sleeps.
 */
@Controller('mcp')
@UseGuards(McpTokenGuard)
export class McpController {
  constructor(private readonly tools: McpToolsService) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const server = this.tools.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      // Plain JSON replies (no event stream): simpler, and safe behind the Next.js proxy.
      enableJsonResponse: true,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  // No server-initiated streams / sessions in stateless mode.
  @Get()
  @Delete()
  notAllowed(@Res() res: Response): void {
    res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  }
}
