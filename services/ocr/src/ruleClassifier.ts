/**
 * Phase 5: Rule-based classifier (first pass)
 * Pure regex/keyword matching for structural transactions that don't need a vendor cache.
 */

export function ruleClassifier(rawDescription: string): string | null {
  const descUpper = rawDescription.toUpperCase();

  // 1. Income / Salary
  if (/SALARY|SAL CREDIT/i.test(descUpper)) {
    return 'Salary & Payroll';
  }

  // 2. Cash Withdrawals
  if (/ATM WDL|CASH WDL/i.test(descUpper)) {
    return 'Cash Withdrawal';
  }

  // 3. Generic Transfers (if no recognizable vendor is found, though vendor token extract might pull names)
  if (/^NEFT|^IMPS|^RTGS/i.test(descUpper) && !descUpper.includes('SWIGGY') && !descUpper.includes('ZOMATO')) {
    return 'Transfers & Investments';
  }

  // 4. Generic POS (if no vendor match)
  // We only want to fallback to Shopping if we absolutely don't know it, but 
  // since this runs *before* the cache, we should be careful. 
  // Actually, POS usually has a vendor name. It's better to let the cache handle it,
  // but if the user requested it as a generic fallback:
  if (/^POS/i.test(descUpper) && descUpper.length < 15) {
    return 'Shopping & Retail';
  }

  return null;
}
