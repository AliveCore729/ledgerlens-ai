import { Injectable, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(
    @InjectQueue('ocr-job') private ocrQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async handleUpload(file: Express.Multer.File, user: any, filePassword?: string) {
    try {
      // Find the first organization the user belongs to (or mock if not found)
      let org: any = await this.prisma.getUserPrimaryOrg(user.userId, {
        include: { organization: true },
      }).then(ou => ou?.organization);
      
      if (!org) {
        org = await this.prisma.organization.findFirst();
      }

      if (!org) {
        // If DB is completely empty of orgs, create a default one for this user!
        org = await this.prisma.organization.create({
          data: {
            name: "Default Workspace",
            tenantId: "default-tenant-" + Date.now(),
            organizationUsers: {
              create: {
                userId: user.userId,
                role: "ADMIN"
              }
            }
          }
        });
      }

      // Enforce trial limit
      const userRecord = await this.prisma.user.findUnique({ where: { id: user.userId } });
      const isSuperAdmin = userRecord?.role === 'SUPER_ADMIN';
      const isActive = org.subscriptionStatus === 'ACTIVE' || isSuperAdmin;
      if (!isActive) {
        const statementCount = await this.prisma.statement.count({
          where: { 
            organizationId: org.id,
            status: { not: 'FAILED' }
          }
        });
        
        if (statementCount >= 1) {
          throw new ForbiddenException('Free trial limit reached. Please contact support to upgrade your plan to process more statements.');
        }
      }

      const statement = await this.prisma.statement.create({
        data: {
          fileName: file.originalname,
          fileUrl: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: 'UPLOADED',
          organizationId: org.id,
          uploadedById: user.userId,
        },
      });

      const fs = require('fs');
      const fileData = fs.readFileSync(file.path).toString('base64');

      // Queue OCR Job with Exponential Backoff for Rate Limits
      await this.ocrQueue.add('process-statement', { 
        statementId: statement.id,
        fileData,
        filePassword,
      }, {
        attempts: 25, // Allow up to 25 attempts for free-tier rate limits
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute base delay between retries
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 }
      });

      // WAKE UP PING: Force Render to wake up the OCR worker if it went to sleep
      if (process.env.OCR_WORKER_URL) {
        try {
          // Fire and forget! We don't await this because Render might take 50 seconds to boot the worker,
          // and we don't want to make the user wait 50 seconds just to see the "Success" message on the frontend.
          fetch(process.env.OCR_WORKER_URL).catch((e) => console.log("Wake up ping failed/timed out, but worker should be booting!"));
        } catch (e) {
          console.error("Failed to ping OCR worker", e);
        }
      }

      // Create Audit Log
      await this.prisma.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.userId,
          action: 'STATEMENT_UPLOADED',
          resource: `Statement: ${file.originalname}`,
        }
      });

      return {
        message: 'Statement uploaded and queued for processing successfully',
        statement,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process upload');
    }
  }
}
