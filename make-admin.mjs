import { PrismaClient } from './packages/database/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({ data: { role: 'SUPER_ADMIN' } });
  console.log('✅ You are now a SUPER_ADMIN! Please logout and login again.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
