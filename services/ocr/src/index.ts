import { Worker } from 'bullmq';
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
    const { statementId, fileData } = job.data;
    console.log(`Processing job ${job.id} for statement ${statementId}`);

    // Fetch statement
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: { uploadedBy: true }
    });

    if (!statement) {
      throw new Error(`Statement ${statementId} not found`);
    }

    let tempFilePath: string = '';
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

    try {
      // Update status to processing
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'PROCESSING' }
      });

      // Write base64 to temp file since containers have isolated disks
      if (!fileData) {
        throw new Error("Missing fileData payload from API");
      }
      const ext = path.extname(statement.fileName || statement.fileUrl || '.pdf');
      tempFilePath = path.join('/tmp', `ledgerlens-ocr-${crypto.randomBytes(4).toString('hex')}${ext}`);
      fs.writeFileSync(tempFilePath, Buffer.from(fileData, 'base64'));

      // 1. Extract Text
      const rawText = await extractText(tempFilePath, statement.mimeType);
      
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

      // Send Email Notification
      const { sendCompletionEmail } = require('./email');
      if (statement.uploadedBy?.email) {
        await sendCompletionEmail(statement.uploadedBy.email, statement.fileName);
      }
    } catch (error: any) {
      console.error(`Failed to process statement ${statementId}:`, error);

      if (error?.message === "RATE_LIMIT") {
        // Mark as delayed in UI so user knows it's waiting for cooldown
        await prisma.statement.update({
          where: { id: statementId },
          data: { status: 'DELAYED' }
        });
        throw error; // Let BullMQ catch it and schedule exponential backoff
      }

      // Update status to failed for any other error
      await prisma.statement.update({
        where: { id: statementId },
        data: { status: 'FAILED' }
      });
      throw error;
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
