import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '../../modules/redis/redis.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if maintenance mode is enabled in Redis
    // Fail open: if Redis is unavailable, assume NOT in maintenance mode
    let isMaintenanceMode: string | null = null;
    try {
      isMaintenanceMode = await this.redisService.get('system:maintenance_mode');
    } catch {
      return true; // Redis unreachable — don't block traffic
    }

    if (isMaintenanceMode !== 'true') {
      return true; // Not in maintenance, let everything pass
    }

    // Always allow auth routes so admins can still log in
    if (request.path.startsWith('/api/v1/auth/') || request.path.startsWith('/auth/')) {
      return true;
    }

    // Check if user is a SUPER_ADMIN by decoding the JWT
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          if (decoded && decoded.role === 'SUPER_ADMIN') {
            return true; // Super Admins bypass maintenance mode
          }
        }
      } catch (e) {
        // ignore decode errors, fallback to blocking
      }
    }

    // If we reach here, it's maintenance mode and user is NOT a super admin
    throw new ServiceUnavailableException('Maintenance Mode Active');
  }
}
