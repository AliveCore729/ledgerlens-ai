import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

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
    
    if (data.text && data.text.trim().length > 100) {
      return data.text;
    }
    
    console.log('[OCR] PDF contains no extractable text. Falling back to pdftoppm and Tesseract OCR...');
    
    const tmpDir = path.join('/tmp', `ledgerlens-ocr-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    
    try {
      // Convert PDF to JPEG images (one per page)
      await execAsync(`pdftoppm -jpeg -r 300 "${resolvedPath}" "${tmpDir}/page"`);
      
      const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('page') && f.endsWith('.jpg')).sort();
      let fullText = '';
      
      for (const file of files) {
        const imagePath = path.join(tmpDir, file);
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
        fullText += text + '\n\n';
      }
      
      return fullText;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } else if (mimeType.startsWith('image/')) {
    const { data: { text } } = await Tesseract.recognize(resolvedPath, 'eng');
    return text;
  }
  
  throw new Error(`Unsupported file type for OCR: ${mimeType}`);
}
