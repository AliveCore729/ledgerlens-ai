import { normalizeDescription, findFuzzyMatch } from './normalizer';

describe('Transaction Normalizer', () => {

  describe('UPI Extraction', () => {
    it('extracts merchant from swiggy@ybl', () => {
      expect(normalizeDescription('UPI/SWIGGY/1234567890/swiggy@ybl')).toBe('SWIGGY');
      expect(normalizeDescription('UPI-SWIGGY BANGALORE-swiggy@ybl-4028123456')).toBe('SWIGGY');
    });

    it('ignores mobile numbers in UPI handles', () => {
      // 9876543210@ybl should fall back to taking the best alphabetical part, which is TESTMERCHANT
      expect(normalizeDescription('UPI/TESTMERCHANT/9876543210@ybl')).toBe('TESTMERCHANT');
    });
  });

  describe('NEFT/IMPS Extraction', () => {
    it('extracts the payee from IMPS', () => {
      expect(normalizeDescription('IMPS-123456789-JOHN DOE-HDFC-9876')).toBe('JOHN DOE');
    });
    
    it('extracts the payee from NEFT', () => {
      expect(normalizeDescription('NEFT/HDFC123456/ALICE SMITH/XYZ')).toBe('ALICE SMITH');
    });
  });

  describe('POS/ATM Extraction', () => {
    it('strips POS and masked cards', () => {
      expect(normalizeDescription('POS 4123XXXX5678 STARBUCKS')).toBe('STARBUCKS');
      expect(normalizeDescription('ATM WDL xxxx1234 HDFC BANK')).toBe('WDL HDFC BANK');
    });
  });

  describe('Noise Word Stripping', () => {
    it('strips common noise words like PVT LTD', () => {
      expect(normalizeDescription('AMAZON SELLER SERVICES PVT LTD')).toBe('AMAZON SELLER SERVICES');
      expect(normalizeDescription('ZOMATO INDIA PRIVATE LIMITED')).toBe('ZOMATO');
    });
  });

  describe('Fuzzy Matching', () => {
    it('matches exact strings', () => {
      expect(findFuzzyMatch('SWIGGY', ['SWIGGY', 'ZOMATO'])).toBe('SWIGGY');
    });

    it('matches substring containment', () => {
      expect(findFuzzyMatch('AMAZON SELLER', ['AMAZON SELLER SERVICES', 'FLIPKART'])).toBe('AMAZON SELLER SERVICES');
      expect(findFuzzyMatch('ZOMATO FOOD', ['ZOMATO', 'UBER'])).toBe('ZOMATO');
    });

    it('ignores short strings to prevent false positives', () => {
      expect(findFuzzyMatch('SBI', ['SBI CARDS', 'SBI LIFE'])).toBeNull(); 
    });
  });
});
