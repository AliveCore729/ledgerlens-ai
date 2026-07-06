import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';

@Injectable()
export class AuditActionInterceptor implements NestInterceptor {
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
          this.prisma.auditLog.create({
            data: {
              userId: user.userId,
              action: action,
              resource: `URL: ${resourceUrl} | Method: ${request.method}`,
            }
          }).catch(err => {
            console.error('Failed to write audit log:', err);
          });
        }
      }),
    );
  }
}
