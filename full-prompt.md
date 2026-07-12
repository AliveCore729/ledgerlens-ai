# Follow-up: 4 corrections from the previous review were not applied

Please apply these specifically — they were requested before but didn't make it into the updated plan.

## 1. Model choice (Open Questions section)
Change the recommendation from Gemini 1.5 Flash to **Gemini 2.5 Flash-Lite** for the batch categorization fallback call. This is a simple vendor-string → category-enum mapping and doesn't need a larger model; Flash-Lite is cheaper per token. Update the "Open Questions" recommendation text accordingly, and confirm which model is used for extraction (Phase 1) vs. categorization fallback (Phase 5/6) — state both explicitly in the plan so it's unambiguous in the code.

## 2. Disable thinking tokens in Phase 1
`temperature: 0` does not disable thinking tokens — it only controls output randomness. If the extraction call uses a Gemini 2.5 model, add `thinkingBudget: 0` explicitly to the generation config in `ai.ts`, alongside `temperature: 0`. If extraction moves to a Flash-Lite variant without a thinking mode, note that explicitly instead so it's clear the config was a deliberate decision, not an oversight.

## 3. Cap `rawExamples` array length
In Phase 3, `VendorCategoryCache.rawExamples` will grow unbounded for high-frequency vendors (SALARY, NEFT could be hit thousands of times). Add to the `VendorCacheService.upsert()` spec: trim `rawExamples` to the last 5 entries before writing, rather than appending indefinitely.

## 4. Specify fuzzy match lookup strategy
Phase 3 currently just says "Implement `VendorCacheService.lookup()` and `upsert()`" with no detail on how fuzzy matching avoids a full table scan per transaction. This needs an explicit decision — pick one and put it in the plan:
- Maintain an in-memory (or Redis) cached list of all `normalizedKey`s, refreshed periodically or on cache write, and run substring-containment fuzzy matching against that list instead of hitting Postgres per transaction.
- OR implement fuzzy matching as a Postgres `LIKE`/trigram query (`pg_trgm` extension) so the DB does the matching efficiently.

Without this decision in the plan, `lookup()` risks becoming a full-table scan per transaction as the cache grows, which defeats the point of the cache being fast.

## 5. Tighten the Verification Plan wording
The "Manual Verification" section still states the outcome as *"reducing API cost by ~90%"* as if it's already established. Reword this to describe measuring the actual reduction using the token logging from Phase 7/8, rather than asserting the number upfront — e.g. "confirm the resulting cost reduction using logged token counts, compared against the original per-statement costs (₹0.35 / ₹1.8 / ₹6 for the three test statements)."