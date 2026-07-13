import { Worker, UnrecoverableError } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@ledgerlens/database';
import { extractText } from './extractor';
import { parseTransactions } from './ai';

import * as http from 'http';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Dummy HTTP server for Render health checks
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OCR Worker is healthy!');
}).listen(port, () => {
  console.log(`Dummy health server listening on port ${port}`);
});

console.log('Starting OCR Worker...');

const worker = new Worker(
  'ocr-job',
  async (job) => {
    const { statementId, fileData, filePassword } = job.data;
    console.log(`Processing job ${job.id} for statement ${statementId}`);

    // Fetch statement
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { uploadedBy: true }
    });

    if (!statement) {
      console.log(`Statement ${statementId} not found at job start. Skipping.`);
      throw new UnrecoverableError(`Statement ${statementId} deleted before processing`);
    }

    let tempFilePath: string = '';
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

    try {
      // Update status to processing and clear any existing checkpointed transactions
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'PROCESSING' }
      });
      await prisma.transaction.deleteMany({
        where: { statementId: statementId }
      });

      // Write base64 to temp file since containers have isolated disks
      if (!fileData) {
        throw new Error("Missing fileData payload from API");
      }
      const ext = path.extname(statement.fileName || statement.fileUrl || '.pdf');
      tempFilePath = path.join('/tmp', `ledgerlens-ocr-${crypto.randomBytes(4).toString('hex')}${ext}`);
      fs.writeFileSync(tempFilePath, Buffer.from(fileData, 'base64'));

      // 1. Extract Text
      const rawText = await extractText(tempFilePath, statement.mimeType, filePassword);
      
      // 2. AI Parsing
      const parsedTransactions = await parseTransactions(rawText, statementId);

      // 3. Transactions are now checkpointed (saved) chunk-by-chunk inside parseTransactions!

      // Update status to completed
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'COMPLETED' }
      });

      console.log(`Successfully processed statement ${statementId}`);

      // Send Email Notification
      const { sendCompletionEmail } = require('./email');
      if (statement.uploadedBy?.email) {
        await sendCompletionEmail(statement.uploadedBy.email, statement.fileName);
      }
    } catch (error: any) {
      if (error?.message === "CANCELLED") {
        throw new UnrecoverableError("Job was cancelled mid-flight.");
      }

      console.error(`Failed to process statement ${statementId}:`, error);

      if (error?.message === "RATE_LIMIT") {
        // Mark as delayed in UI so user knows it's waiting for cooldown
        await prisma.statement.update({
          where: { id: statementId },
          data: { status: 'DELAYED' }
        }).catch(() => {});
        throw error; // Let BullMQ catch it and schedule exponential backoff
      }

      // Update status to failed for any other error (including Quota Exhausted, Auth Errors, Corrupted PDFs)
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'FAILED' }
      }).catch(() => {});
      
      // Throw UnrecoverableError so BullMQ fails the job instantly and does NOT retry 25 times!
      throw new UnrecoverableError(error?.message || "Terminal Error");
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          console.error(`Failed to delete temp file ${tempFilePath}`, e);
        }
      }
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

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down worker gracefully...`);
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

