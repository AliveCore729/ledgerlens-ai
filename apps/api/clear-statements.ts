import { prisma } from '@ledgerlens/database';

async function clear() {
  console.log('Deleting all statements from the database...');
  const res = await prisma.statement.deleteMany({});
  console.log(`Successfully deleted ${res.count} statements (all associated transactions have been cascaded and deleted as well).`);
}

clear()
  .catch((e) => {
    console.error('Failed to delete statements:', e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
