import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';

@Injectable()
export class AuditActionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditActionInterceptor.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    
    // If no decorator is present, just continue
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard
    
    return next.handle().pipe(
      tap(() => {
        // Record audit log asynchronously after successful response
        if (user && user.userId) {
          const resourceUrl = request.url;
          
          // Attempt to extract org ID from params or body
          const targetOrgId = request.params?.id || request.body?.organizationId || 'UNKNOWN';

          // Sanitize body to remove secrets before logging
          const sanitizedBody = { ...request.body };
          const sensitiveKeys = ['password', 'token', 'secret', 'filePassword'];
          for (const key of Object.keys(sanitizedBody)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
              sanitizedBody[key] = '[REDACTED]';
            }
          }

          const payloadStr = JSON.stringify(sanitizedBody);
          const resourceString = `URL: ${resourceUrl} | Method: ${request.method} | TargetOrg: ${targetOrgId} | Payload: ${payloadStr}`;

          this.prisma.auditLog.create({
            data: {
              userId: user.userId,
              action: action,
              resource: resourceString,
            }
          }).catch(err => {
            this.logger.error({ err, action, user: user.userId }, 'Failed to write audit log to database');
          });
        }
      }),
    );
  }
}
