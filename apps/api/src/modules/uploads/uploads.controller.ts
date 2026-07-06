import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { FileInterceptor } from "@nestjs/platform-express";

import { diskStorage } from "multer";

import { extname } from "path";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ActiveSessionGuard } from "../auth/active-session.guard";

import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @UseGuards(JwtAuthGuard, ActiveSessionGuard)
  @Post("statement")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",

        filename: (_req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

          callback(
            null,
            `${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),

      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              "Only PDF, CSV, Excel, and image files are allowed",
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  uploadStatement(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body("filePassword") filePassword?: string,
  ) {
    return this.uploadsService.handleUpload(file, user, filePassword);
  }
}