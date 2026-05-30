import { prisma } from '@ledgerlens/database';
import { extractText } from './src/extractor';
import { parseTransactions } from './src/ai';

async function test() {
  const statement = await prisma.statement.findUnique({
    where: { id: '12aa48f5-5d5a-476d-81f3-12ca07c90d96' }
  });
  if (!statement) return console.log('Statement not found');
  
  try {
    const rawText = await extractText(statement.fileUrl, statement.mimeType);
    console.log("Raw text length:", rawText.length);
    const parsedTransactions = await parseTransactions(rawText);
    console.log('Parsed successfully! Length:', parsedTransactions.length);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}
test().finally(() => process.exit(0));
