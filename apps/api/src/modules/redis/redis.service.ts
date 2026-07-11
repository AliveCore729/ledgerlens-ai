import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisOptions = {
      commandTimeout: 3000,      // Fail after 3s instead of hanging forever
      enableOfflineQueue: false, // Throw immediately when Redis is offline
      retryStrategy: (times: number) => {
        if (times > 5) return null; // Stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
    };
    if (redisUrl) {
      this.client = new Redis(redisUrl, redisOptions);
    } else {
      this.client = new Redis({ host: 'localhost', port: 6379, ...redisOptions });
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.client.set(key, value);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
