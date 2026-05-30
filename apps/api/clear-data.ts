import { PrismaClient } from '@ledgerlens/database';

const prisma = new PrismaClient();

async function main() {
  console.log('Sweeping the database...');

  // 1. Delete all transactions
  const deletedTx = await prisma.transaction.deleteMany({});
  console.log(`✅ Deleted ${deletedTx.count} transactions.`);

  // 2. Delete all statements
  const deletedStatements = await prisma.statement.deleteMany({});
  console.log(`✅ Deleted ${deletedStatements.count} statements.`);

  console.log('Data cleared successfully! Your users are still intact.');
}

main()
  .catch((e) => {
    console.error('Error clearing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });