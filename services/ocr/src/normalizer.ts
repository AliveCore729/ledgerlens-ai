/**
 * Phase 2: Description Normalizer
 * Converts raw bank transaction descriptions into stable cache keys.
 */

const NOISE_WORDS = [
  'PVT', 'LTD', 'LIMITED', 'INDIA', 'PAYMENT', 'ORDER', 'PRIVATE',
  'BANGALORE', 'MUMBAI', 'DELHI', 'CHENNAI', 'HYDERABAD', 'PUNE', 'KOLKATA'
];

/**
 * Strips long numeric sequences, masked card numbers, and dates.
 */
export function stripVariableTokens(desc: string): string {
  let cleaned = desc;
  // Strip 10+ digit numbers (reference numbers, accounts)
  cleaned = cleaned.replace(/\b\d{10,}\b/g, '');
  // Strip masked cards like xxxx4021 or 1234xxxx5678
  cleaned = cleaned.replace(/\b[xX*]+\d{4}\b/g, '');
  cleaned = cleaned.replace(/\b\d{4}[xX*]+\d{4}\b/g, '');
  // Strip short date-like structures (e.g. 12-04-2023 or 12/04/23)
  cleaned = cleaned.replace(/\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/g, '');
  return cleaned.trim();
}

/**
 * Extracts the merchant prefix from a UPI VPA string (e.g. 'swiggy@ybl' -> 'swiggy')
 */
export function extractUpiHandle(desc: string): string | null {
  const upiMatch = desc.match(/([a-zA-Z0-9.-]+)@(ybl|icici|okaxis|paytm|oksbi|sbi|okhdfcbank|axl|ibl)/i);
  if (upiMatch && upiMatch[1]) {
    // If it's a mobile number @upi, skip it, we don't want to cache random mobile numbers
    if (/^\d{10}$/.test(upiMatch[1])) {
      return null;
    }
    return upiMatch[1];
  }
  return null;
}

/**
 * Rail-aware extraction of the core vendor token
 */
export function extractVendorToken(desc: string): string {
  const descUpper = desc.toUpperCase();

  // 1. UPI Extraction
  if (descUpper.includes('UPI')) {
    const handle = extractUpiHandle(desc);
    if (handle) return handle;

    // Fallback split on `/` or `-` for UPI/SWIGGY/1234
    const parts = desc.split(/[\/-]/);
    // Find the longest alphabetic non-numeric segment
    let bestPart = '';
    for (const p of parts) {
      if (!/^\d+$/.test(p.trim()) && p.trim().length > bestPart.length && !p.toUpperCase().includes('UPI')) {
        bestPart = p.trim();
      }
    }
    if (bestPart) return bestPart;
  }

  // 2. POS / ATM Extraction
  if (descUpper.startsWith('POS') || descUpper.startsWith('ATM')) {
    return stripVariableTokens(desc).replace(/^(POS|ATM)\b/i, '').trim();
  }

  // 3. NEFT / IMPS / RTGS Extraction
  if (descUpper.startsWith('NEFT') || descUpper.startsWith('IMPS') || descUpper.startsWith('RTGS')) {
    const parts = desc.split(/[\/-]/);
    let bestPart = '';
    for (const p of parts) {
      if (!/^\d+$/.test(p.trim()) && p.trim().length > bestPart.length && !p.toUpperCase().match(/^(NEFT|IMPS|RTGS)/)) {
        bestPart = p.trim();
      }
    }
    if (bestPart) return bestPart;
  }

  // 4. Fallback
  return stripVariableTokens(desc);
}

/**
 * Uppercases, strips noise words, and collapses punctuation/whitespace
 */
export function canonicalize(vendorToken: string): string {
  let result = vendorToken.toUpperCase();
  
  // Replace punctuation with space
  result = result.replace(/[._\-\/]/g, ' ');
  
  // Strip noise words
  const words = result.split(/\s+/);
  const filtered = words.filter(w => !NOISE_WORDS.includes(w) && w.length > 0);
  
  result = filtered.join(' ');
  // Remove all non-alphanumeric except spaces
  result = result.replace(/[^A-Z0-9\s]/g, '');
  return result.trim();
}

/**
 * The master pipeline to generate the cache key
 */
export function normalizeDescription(rawDesc: string): string {
  const token = extractVendorToken(rawDesc);
  return canonicalize(token);
}

/**
 * Exact match first, then substring containment either direction.
 * Skips fuzzy matching for keys under 4 characters.
 */
export function findFuzzyMatch(normalizedKey: string, existingKeys: string[]): string | null {
  if (!normalizedKey) return null;

  // 1. Exact match
  if (existingKeys.includes(normalizedKey)) {
    return normalizedKey;
  }

  // 2. Substring match (if long enough)
  if (normalizedKey.length >= 4) {
    for (const key of existingKeys) {
      if (key.length >= 4) {
        if (key.includes(normalizedKey) || normalizedKey.includes(key)) {
          return key;
        }
      }
    }
  }

  return null;
}
