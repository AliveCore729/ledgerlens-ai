import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Setting up test data...");
  const userA = await prisma.user.create({ data: { email: 'userA@test.com', firstName: 'A' } });
  const userB = await prisma.user.create({ data: { email: 'userB@test.com', firstName: 'B' } });

  const orgA = await prisma.organization.create({ data: { name: 'Org A' } });
  const orgB = await prisma.organization.create({ data: { name: 'Org B' } });

  await prisma.organizationUser.create({ data: { userId: userA.id, organizationId: orgA.id } });
  await prisma.organizationUser.create({ data: { userId: userB.id, organizationId: orgB.id } });

  const statementOrgA = await prisma.statement.create({
    data: {
      fileName: 'secret-a.pdf',
      fileUrl: '/tmp/a.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      organizationId: orgA.id,
      uploadedById: userA.id
    }
  });

  console.log(`Created Statement ${statementOrgA.id} in Org A.`);
  console.log(`Attempting to access Statement ${statementOrgA.id} as User B (Org B)...`);

  // Simulate statements.controller.ts getStatement logic
  const targetId = statementOrgA.id;
  const currentUserId = userB.id;

  const statement = await prisma.statement.findFirst({
    where: { 
      id: targetId,
      organization: { organizationUsers: { some: { userId: currentUserId } } }
    }
  });

  if (!statement) {
    console.log("RESULT: 403/404 - Statement not found or access denied. ISOLATION WORKED.");
  } else {
    console.log("RESULT: ERROR - Statement accessed successfully! ISOLATION FAILED.");
  }

  // Cleanup
  console.log("Cleaning up test data...");
  await prisma.statement.delete({ where: { id: statementOrgA.id } });
  await prisma.organization.delete({ where: { id: orgA.id } });
  await prisma.organization.delete({ where: { id: orgB.id } });
  await prisma.user.delete({ where: { id: userA.id } });
  await prisma.user.delete({ where: { id: userB.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
