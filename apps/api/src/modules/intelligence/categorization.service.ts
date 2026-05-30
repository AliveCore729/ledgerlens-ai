import { Injectable } from "@nestjs/common";

@Injectable()
export class CategorizationService {
  categorize(vendor: string) {
    const upper = vendor.toUpperCase();

    if (/\b(PETROL|FUEL|HPCL|BPCL|IOCL|IOC|INDIAN OIL|SHELL)\b/.test(upper)) {
      return "FUEL";
    }

    if (/\b(ELECTRIC|POWER|BESCOM|MSEB|UTILITY|WATER BILL|GAS BILL)\b/.test(upper)) {
      return "ELECTRICITY";
    }

    if (/\b(AMAZON|FLIPKART|MYNTRA|DMART|RELIANCE|SHOPPING|STORE)\b/.test(upper)) {
      return "PURCHASE";
    }

    if (/\b(SALARY|PAYROLL|PAYMENT FROM EMPLOYER)\b/.test(upper)) {
      return "SALARY";
    }

    if (/\b(RENT|HOUSE RENT|LANDLORD|LEASE)\b/.test(upper)) {
      return "RENT";
    }

    if (/\b(ZOMATO|SWIGGY|RESTAURANT|CAFE|FOOD|DOMINOS|MCDONALDS|KFC)\b/.test(upper)) {
      return "FOOD";
    }

    if (/\b(LIC|INSURANCE|POLICY|PREMIUM)\b/.test(upper)) {
      return "INSURANCE";
    }

    if (/\b(EMI|LOAN|BAJAJ FINSERV|HDFC LOAN|ICICI LOAN)\b/.test(upper)) {
      return "LOAN";
    }

    if (/\b(TAX|GST|TDS|INCOME TAX|ADVANCE TAX)\b/.test(upper)) {
      return "TAX";
    }

    if (/\b(ATM|CASH WD|WITHDRAWAL|WDL)\b/.test(upper)) {
      return "MISCELLANEOUS";
    }

    return "UNCATEGORIZED";
  }
}