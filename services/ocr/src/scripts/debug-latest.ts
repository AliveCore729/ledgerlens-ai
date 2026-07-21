import { prisma } from '@ledgerlens/database';

async function run() {
  const statements = await prisma.statement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.table(statements.map(s => ({ id: s.id, file: s.fileName, createdAt: s.createdAt, status: s.status })));
  process.exit(0);
}

run();
