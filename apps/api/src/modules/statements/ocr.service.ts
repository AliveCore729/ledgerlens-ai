import { Injectable } from "@nestjs/common";

import * as Tesseract from "tesseract.js";

@Injectable()
export class OcrService {
  async extractTextFromImage(imagePath: string) {
    const result = await Tesseract.recognize(imagePath, "eng");

    return result.data.text;
  }
}