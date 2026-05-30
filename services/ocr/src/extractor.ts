import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  let resolvedPath = filePath;
  if (!path.isAbsolute(filePath)) {
    // Resolve relative path against apps/api where the files are actually uploaded
    resolvedPath = path.resolve(__dirname, '../../../apps/api', filePath);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    const dataBuffer = fs.readFileSync(resolvedPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (mimeType.startsWith('image/')) {
    const { data: { text } } = await Tesseract.recognize(resolvedPath, 'eng');
    return text;
  }
  
  throw new Error(`Unsupported file type for OCR: ${mimeType}`);
}
