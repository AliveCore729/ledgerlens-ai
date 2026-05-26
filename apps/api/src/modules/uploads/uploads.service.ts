import { Injectable } from "@nestjs/common";

import { StatementsService } from "../statements/statements.service";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UploadsService {
  constructor(
    private statementsService: StatementsService,
    private prisma: PrismaService,
  ) { }

  async handleUpload(file: Express.Multer.File, user: any) {
    const processedData =
      await this.statementsService.processStatement(
        file.path,
      );

    const statement =
      await this.prisma.statement.create({
        data: {
          originalName: file.originalname,
          filename: file.filename,
          uploadedBy: user.userId,
        },
      });

    for (const transaction of await processedData.transactions) {
      await this.prisma.transaction.create({
        data: {
          statementId: statement.id,

          raw: transaction.raw || "",

          date: transaction.date || "",

          amount: Number(transaction.amount) || 0,

          type: transaction.type || "UNKNOWN",

          vendor: transaction.vendor || null,

          normalizedVendor:
            transaction.normalizedVendor || null,

          category:
            transaction.category || "UNCATEGORIZED",
        },
      });
    }

    return {
      message: "Statement processed successfully",

      uploadedBy: user.email,

      file: {
        originalName: file.originalname,
        filename: file.filename,
      },

      extractedPreview:
        processedData.extractedText.slice(0, 1000),

      transactions:
        (await processedData.transactions).slice(0, 20),
    };
  }
}