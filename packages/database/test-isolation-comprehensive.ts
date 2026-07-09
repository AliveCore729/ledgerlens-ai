import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Setting up test data...");
  const userA1 = await prisma.user.create({ data: { email: 'userA1@test.com', firstName: 'A1' } });
  const userA2 = await prisma.user.create({ data: { email: 'userA2@test.com', firstName: 'A2' } });
  const userB = await prisma.user.create({ data: { email: 'userB@test.com', firstName: 'B' } });

  const orgA = await prisma.organization.create({ data: { name: 'Org A' } });
  const orgB = await prisma.organization.create({ data: { name: 'Org B' } });

  await prisma.organizationUser.create({ data: { userId: userA1.id, organizationId: orgA.id } });
  await prisma.organizationUser.create({ data: { userId: userA2.id, organizationId: orgA.id } });
  await prisma.organizationUser.create({ data: { userId: userB.id, organizationId: orgB.id } });

  const statementOrgA = await prisma.statement.create({
    data: {
      fileName: 'secret-a.pdf',
      fileUrl: '/tmp/a.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      organizationId: orgA.id,
      uploadedById: userA1.id
    }
  });

  const transactionOrgA = await prisma.transaction.create({
    data: {
      statementId: statementOrgA.id,
      date: new Date().toISOString(),
      vendor: 'Secret Vendor', type: 'DEBIT',
      amount: 100.0,
    }
  });

  console.log("\n--- TEST 1: POSITIVE STATEMENT ACCESS ---");
  const statementPositive = await prisma.statement.findFirst({
    where: { 
      id: statementOrgA.id,
      organization: { organizationUsers: { some: { userId: userA2.id } } }
    }
  });
  if (statementPositive) console.log("✅ PASSED: UserA2 (same org) successfully accessed Statement.");
  else console.log("❌ FAILED: UserA2 could not access Statement.");

  console.log("\n--- TEST 2: NEGATIVE STATEMENT ACCESS ---");
  const statementNegative = await prisma.statement.findFirst({
    where: { 
      id: statementOrgA.id,
      organization: { organizationUsers: { some: { userId: userB.id } } }
    }
  });
  if (!statementNegative) console.log("✅ PASSED: UserB (different org) blocked from Statement.");
  else console.log("❌ FAILED: UserB accessed Statement.");

  console.log("\n--- TEST 3: POSITIVE TRANSACTION ACCESS ---");
  const transactionPositive = await prisma.transaction.findFirst({
    where: { 
      id: transactionOrgA.id,
      statement: { organization: { organizationUsers: { some: { userId: userA2.id } } } }
    }
  });
  if (transactionPositive) console.log("✅ PASSED: UserA2 (same org) successfully accessed Transaction.");
  else console.log("❌ FAILED: UserA2 could not access Transaction.");

  console.log("\n--- TEST 4: NEGATIVE TRANSACTION ACCESS ---");
  const transactionNegative = await prisma.transaction.findFirst({
    where: { 
      id: transactionOrgA.id,
      statement: { organization: { organizationUsers: { some: { userId: userB.id } } } }
    }
  });
  if (!transactionNegative) console.log("✅ PASSED: UserB (different org) blocked from Transaction.");
  else console.log("❌ FAILED: UserB accessed Transaction.");

  // Cleanup
  console.log("\nCleaning up...");
  await prisma.transaction.delete({ where: { id: transactionOrgA.id } });
  await prisma.statement.delete({ where: { id: statementOrgA.id } });
  await prisma.organization.delete({ where: { id: orgA.id } });
  await prisma.organization.delete({ where: { id: orgB.id } });
  await prisma.user.delete({ where: { id: userA1.id } });
  await prisma.user.delete({ where: { id: userA2.id } });
  await prisma.user.delete({ where: { id: userB.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
