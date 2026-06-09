import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@ledgerlens/database';
import { extractText } from './extractor';
import { parseTransactions } from './ai';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
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
        const now = new Date();
        await prisma.transaction.createMany({
          data: parsedTransactions.map((tx: any, index: number) => ({
            statementId: statement.id,
            date: tx.date,
            time: tx.time || null,
            amount: tx.amount,
            type: tx.type,
            vendor: tx.vendor,
            category: tx.category,
            raw: tx.narration || tx.vendor,
            createdAt: new Date(now.getTime() + index) // Offset by index to strictly preserve statement order
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
  { connection: connection as any }
);

worker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
