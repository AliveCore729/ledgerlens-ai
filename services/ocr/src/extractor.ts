import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as xlsx from 'xlsx';

const execAsync = promisify(exec);

export async function extractText(filePath: string, mimeType: string, password?: string): Promise<string> {
  let resolvedPath = filePath;
  if (!path.isAbsolute(filePath)) {
    // Resolve relative path against apps/api where the files are actually uploaded
    resolvedPath = path.resolve(__dirname, '../../../apps/api', filePath);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    let dataBuffer = fs.readFileSync(resolvedPath);
    let data: any = { text: '' };
    
    try {
      // If a password is provided, pdf-parse will likely fail or return empty, 
      // but we try it anyway in case it wasn't actually locked.
      data = await pdfParse(dataBuffer);
    } catch (e) {
      console.log('[OCR] pdf-parse failed (likely password protected). Falling back to pdftoppm...');
    }
    
    if (data.text && data.text.trim().length > 100 && !password) {
      return data.text;
    }
    
    console.log('[OCR] PDF contains no extractable text. Falling back to pdftoppm and Tesseract OCR...');
    
    const tmpDir = path.join('/tmp', `ledgerlens-ocr-${crypto.randomBytes(4).toString('hex')}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    
    try {
      // Convert PDF to JPEG images (one per page)
      const passFlag = password ? `-upw "${password.replace(/"/g, '\\"')}"` : '';
      await execAsync(`pdftoppm -jpeg -r 300 ${passFlag} "${resolvedPath}" "${tmpDir}/page"`);
      
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
  } else if (mimeType === 'text/csv' || ext === '.csv') {
    console.log('[OCR] Detected CSV. Reading directly as text...');
    const text = fs.readFileSync(resolvedPath, 'utf-8');
    return text;
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === '.xls' || ext === '.xlsx') {
    console.log('[OCR] Detected Excel file. Converting to CSV string...');
    const workbook = xlsx.readFile(resolvedPath, { password: password });
    let fullText = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(sheet);
      fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
    }
    return fullText;
  }
  
  throw new Error(`Unsupported file type for OCR: ${mimeType}`);
}
