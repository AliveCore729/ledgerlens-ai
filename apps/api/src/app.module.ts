import { PrismaModule } from "./modules/prisma/prisma.module";
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
      validationSchema: envValidationSchema,
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
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
    TeamModule
  ],
})
export class AppModule { }
