import { PrismaModule } from "./modules/prisma/prisma.module";
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidationSchema } from './common/config/env.validation';
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { StatementsModule } from "./modules/statements/statements.module";
import { IntelligenceModule } from "./modules/intelligence/intelligence.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { VendorsModule } from './modules/vendors/vendors.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { TeamModule } from './modules/team/team.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
      validationSchema: envValidationSchema,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            connection: {
              host: url.hostname,
              port: parseInt(url.port, 10) || 6379,
              username: url.username || undefined,
              password: url.password || undefined,
            },
          };
        }
        return {
          connection: {
            host: 'localhost',
            port: 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    UploadsModule,
    StatementsModule,
    IntelligenceModule,
    AnalyticsModule,
    TransactionsModule,
    VendorsModule,
    BillingModule,
    AdminModule,
    TeamModule,
    AuditModule
  ],
})
export class AppModule { }
