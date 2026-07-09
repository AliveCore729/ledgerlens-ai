import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password@localhost:5433/ledgerlens_test?schema=public"
    }
  }
});

async function run() {
  // Create an org with ACTIVE subscription
  const org1 = await prisma.organization.create({ data: { name: 'Active Org' } });
  await prisma.subscription.create({
    data: {
      organizationId: org1.id,
      status: 'ACTIVE',
      plan: 'PRO'
    }
  });

  // Create an org with SUSPENDED subscription
  const org2 = await prisma.organization.create({ data: { name: 'Suspended Org' } });
  await prisma.subscription.create({
    data: {
      organizationId: org2.id,
      status: 'SUSPENDED',
      plan: 'PRO'
    }
  });

  // Create an org with PAST_DUE subscription
  const org3 = await prisma.organization.create({ data: { name: 'Past Due Org' } });
  await prisma.subscription.create({
    data: {
      organizationId: org3.id,
      status: 'PAST_DUE',
      plan: 'PRO'
    }
  });
  
  console.log("Seeded old schema data");
}

run().catch(console.error).finally(() => prisma.$disconnect());
