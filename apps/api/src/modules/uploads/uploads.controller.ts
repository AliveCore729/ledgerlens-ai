import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { diskStorage } from "multer";

import { extname } from "path";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @UseGuards(JwtAuthGuard)
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
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              "Only PDF and image files are allowed",
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadStatement(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.handleUpload(file, user);
  }
}