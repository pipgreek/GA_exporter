import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** Bearer-token check for /mcp. With MCP_AUTH_TOKEN unset the endpoint is disabled, never open. */
@Injectable()
export class McpTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('MCP_AUTH_TOKEN');
    if (!expected) {
      throw new ServiceUnavailableException('The MCP endpoint is not enabled.');
    }
    const header = context.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    const given = Buffer.from(match?.[1] ?? '');
    const wanted = Buffer.from(expected);
    if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
      throw new UnauthorizedException('Invalid or missing token.');
    }
    return true;
  }
}
