import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { StatementsModule } from '../statements/statements.module';

@Module({
  imports: [
    PrismaModule,
    StatementsModule,
    BullModule.registerQueue({
      name: 'ocr-job',
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}