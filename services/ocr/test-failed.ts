import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '@ledgerlens/database';
import { extractText } from './src/extractor';
import { parseTransactions } from './src/ai';

async function test() {
  const statement = await prisma.statement.findFirst({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!statement) return console.log('No failed statements found');
  console.log(`Testing statement: ${statement.fileName} (${statement.id})`);
  
  try {
    console.log('Extracting text...');
    const rawText = await extractText(statement.fileUrl, statement.mimeType);
    console.log("Raw text length:", rawText.length);
    
    console.log('Parsing transactions...');
    const parsedTransactions = await parseTransactions(rawText);
    console.log('Parsed successfully! Length:', parsedTransactions.length);
  } catch (error: any) {
    console.error('Error occurred:', error.message, error.status, JSON.stringify(error.errorDetails));
  }
}
test().finally(() => process.exit(0));
