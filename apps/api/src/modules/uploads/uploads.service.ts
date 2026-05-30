import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(
    @InjectQueue('ocr-job') private ocrQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async handleUpload(file: Express.Multer.File, user: any) {
    try {
      // Find the first organization the user belongs to (or mock if not found)
      let org: any = await this.prisma.organizationUser.findFirst({
        where: { userId: user.userId },
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

      // Queue OCR Job
      await this.ocrQueue.add('process-statement', { statementId: statement.id });

      return {
        message: 'Statement uploaded and queued for processing successfully',
        statement,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }
}
