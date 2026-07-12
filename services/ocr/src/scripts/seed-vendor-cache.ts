import { prisma } from '@ledgerlens/database';
import * as fs from 'fs';
import * as path from 'path';

async function seedCache() {
  console.log("Starting vendor cache seed...");
  
  const seedFilePath = path.join(__dirname, '../seed-data/vendor-categories.json');
  const rawData = fs.readFileSync(seedFilePath, 'utf8');
  const vendors = JSON.parse(rawData);

  let successCount = 0;

  for (const v of vendors) {
    try {
      await prisma.vendorCategoryCache.upsert({
        where: { normalizedKey: v.normalizedKey },
        update: {
          category: v.category,
          confidence: 'admin_override'
        },
        create: {
          normalizedKey: v.normalizedKey,
          category: v.category,
          confidence: 'admin_override',
          hitCount: 1
        }
      });
      successCount++;
    } catch (e) {
      console.error(`Failed to seed ${v.normalizedKey}:`, e);
    }
  }

  console.log(`Successfully seeded ${successCount} vendors into the global cache.`);
}

seedCache()
  .catch(e => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
