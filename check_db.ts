import { PrismaClient } from './packages/database/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();
async function main() {
  const statements = await prisma.statement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(statements.map(s => ({ id: s.id, status: s.status, fileName: s.fileName })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
