import { Injectable } from "@nestjs/common";

import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

import * as Tesseract from "tesseract.js";

const execFileAsync = promisify(execFile);

@Injectable()
export class OcrService {
  async extractTextFromImage(imagePath: string) {
    try {
      const { stdout } = await execFileAsync("tesseract", [
        imagePath,
        "stdout",
        "--psm",
        "6",
      ]);

      return stdout;
    } catch {
      const result = await Tesseract.recognize(imagePath, "eng");

      return result.data.text;
    }
  }

  async extractTextFromPdfLayout(pdfPath: string) {
    try {
      const { stdout } = await execFileAsync("pdftotext", [
        "-layout",
        "-nopgbrk",
        pdfPath,
        "-",
      ]);

      return stdout;
    } catch {
      return "";
    }
  }

  async extractTextFromPdf(pdfPath: string) {
    const outputDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "ledgerlens-ocr-"),
    );

    const outputPrefix = path.join(outputDir, "page");

    try {
      await execFileAsync("pdftoppm", [
        "-png",
        "-r",
        "200",
        pdfPath,
        outputPrefix,
      ]);

      const pageImages = (await fs.promises.readdir(outputDir))
        .filter((file) => file.endsWith(".png"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((file) => path.join(outputDir, file));

      const pageTexts: string[] = [];

      for (const pageImage of pageImages) {
        pageTexts.push(await this.extractTextFromImage(pageImage));
      }

      return pageTexts.join("\n");
    } finally {
      await fs.promises.rm(outputDir, {
        recursive: true,
        force: true,
      });
    }
  }
}
