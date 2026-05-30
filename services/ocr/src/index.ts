import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@ledgerlens/database';
import { extractText } from './extractor';
import { parseTransactions } from './ai';

const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

console.log('Starting OCR Worker...');

const worker = new Worker(
  'ocr-job',
  async (job) => {
    const { statementId } = job.data;
    console.log(`Processing job ${job.id} for statement ${statementId}`);

    // Fetch statement
    const statement = await prisma.statement.findUnique({
      where: { id: statementId }
    });

    if (!statement) {
      throw new Error(`Statement ${statementId} not found`);
    }

    try {
      // Update status to processing
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'PROCESSING' }
      });

      // 1. Extract Text
      const rawText = await extractText(statement.fileUrl, statement.mimeType);
      
      // 2. AI Parsing
      const parsedTransactions = await parseTransactions(rawText);

      // 3. Save Transactions
      if (parsedTransactions.length > 0) {
        await prisma.transaction.createMany({
          data: parsedTransactions.map((tx: any) => ({
            statementId: statement.id,
            date: tx.date,
            amount: tx.amount,
            type: tx.type,
            vendor: tx.vendor,
            category: tx.category,
            raw: tx.narration || tx.vendor // Use AI extracted narration, fallback to vendor
          }))
        });
      }

      // Update status to completed
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'COMPLETED' }
      });

      console.log(`Successfully processed statement ${statementId}`);
    } catch (error) {
      console.error(`Failed to process statement ${statementId}:`, error);
      // Update status to failed
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
