import { prisma } from '@ledgerlens/database';
import { findFuzzyMatch } from './normalizer';

type CacheEntry = {
  category: string;
  confidence: string;
};

export class VendorCacheService {
  // In-memory cache for exact matches and fast fuzzy matching
  private static memoryCache: Map<string, CacheEntry> = new Map();
  private static cachedKeys: string[] = [];
  private static isInitialized = false;

  /**
   * Loads the entire VendorCategoryCache from DB into memory.
   * This is fast because the table only grows to O(unique vendors) ~ maybe 10k rows.
   */
  static async initialize() {
    if (this.isInitialized) return;
    
    console.log("Initializing global vendor cache from DB...");
    const allEntries = await prisma.vendorCategoryCache.findMany();
    
    for (const entry of allEntries) {
      this.memoryCache.set(entry.normalizedKey, {
        category: entry.category,
        confidence: entry.confidence
      });
    }
    
    this.cachedKeys = Array.from(this.memoryCache.keys());
    this.isInitialized = true;
    console.log(`Loaded ${this.cachedKeys.length} vendor patterns into cache.`);
  }

  /**
   * Look up a normalized key using exact match, then substring fuzzy match.
   */
  static async lookup(normalizedKey: string): Promise<CacheEntry | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const matchedKey = findFuzzyMatch(normalizedKey, this.cachedKeys);
    
    if (matchedKey) {
      const entry = this.memoryCache.get(matchedKey);
      if (entry) {
        // Asynchronously update DB hit count without blocking the lookup
        prisma.vendorCategoryCache.update({
          where: { normalizedKey: matchedKey },
          data: { 
            hitCount: { increment: 1 },
            updatedAt: new Date()
          }
        }).catch(err => console.error("Failed to update cache hit count:", err));
        
        return entry;
      }
    }
    
    return null;
  }

  /**
   * Upsert a new vendor mapping into the cache.
   */
  static async upsert(normalizedKey: string, category: string, confidence: string, rawExample: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Update in-memory cache immediately
    this.memoryCache.set(normalizedKey, { category, confidence });
    if (!this.cachedKeys.includes(normalizedKey)) {
      this.cachedKeys.push(normalizedKey);
    }

    // Persist to DB
    const existing = await prisma.vendorCategoryCache.findUnique({
      where: { normalizedKey }
    });

    let newExamples = existing ? existing.rawExamples : [];
    if (!newExamples.includes(rawExample)) {
      newExamples.push(rawExample);
    }
    
    // Cap at last 5 examples to prevent unbounded growth
    if (newExamples.length > 5) {
      newExamples = newExamples.slice(newExamples.length - 5);
    }

    await prisma.vendorCategoryCache.upsert({
      where: { normalizedKey },
      update: {
        rawExamples: newExamples,
        category,
        confidence,
        hitCount: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        normalizedKey,
        rawExamples: newExamples,
        category,
        confidence,
        hitCount: 1
      }
    });
  }
}
