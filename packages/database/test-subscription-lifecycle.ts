import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log("Setting up E2E Test...");
  const adminUser = await prisma.user.create({ data: { email: 'admin-e2e@test.com', role: 'SUPER_ADMIN' } });
  const user = await prisma.user.create({ data: { email: 'user-e2e@test.com' } });
  const org = await prisma.organization.create({ data: { name: 'E2E Test Org' } }); // Defaults to PENDING
  await prisma.organizationUser.create({ data: { userId: user.id, organizationId: org.id } });

  console.log("1. CREATED ORG -> Status:", org.subscriptionStatus);

  // We can't hit the HTTP layer easily without a full token setup, 
  // so we will test the logic inside ActiveSessionGuard manually for this user.
  const checkAccess = async (label: string) => {
    const orgUser = await prisma.organizationUser.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      include: { organization: { select: { subscriptionStatus: true } } }
    });
    if (orgUser?.organization.subscriptionStatus !== 'ACTIVE') {
      console.log(`[${label}] ❌ ACCESS BLOCKED (403): Status is ${orgUser?.organization.subscriptionStatus}`);
    } else {
      console.log(`[${label}] ✅ ACCESS GRANTED: Status is ACTIVE`);
    }
  };

  await checkAccess("Initial PENDING State");

  console.log("\n2. ADMIN ACTIVATES SUBSCRIPTION...");
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      subscriptionStatus: 'ACTIVE',
      paymentReference: 'STRIPE_MIGRATION',
      subscriptionExpiresAt: new Date(Date.now() + 86400000), // +1 day
      activatedBy: adminUser.id
    }
  });

  await checkAccess("After Admin Activation");

  console.log("\n3. RUNNING EXPIRY JOB...");
  // Simulate the BullMQ processor job
  const expiredCount = await prisma.organization.updateMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: { lte: new Date(Date.now() + 86400000 * 2) } // Simulate future date
    },
    data: { subscriptionStatus: 'EXPIRED' }
  });
  console.log(`Expired ${expiredCount.count} organizations.`);

  await checkAccess("After Expiry Job");

  console.log("\n4. REACTIVATING...");
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: new Date(Date.now() + 86400000 * 30),
    }
  });

  await checkAccess("After Reactivation");

  // Cleanup
  console.log("\nCleaning up E2E Test...");
  await prisma.organization.delete({ where: { id: org.id } });
  await prisma.user.delete({ where: { id: adminUser.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

run().catch(console.error).finally(() => prisma.$disconnect());
