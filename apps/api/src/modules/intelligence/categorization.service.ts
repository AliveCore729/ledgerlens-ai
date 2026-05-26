import { Injectable } from "@nestjs/common";

@Injectable()
export class CategorizationService {
  categorize(vendor: string) {
    const upper = vendor.toUpperCase();

    if (
      upper.includes("PETROL") ||
      upper.includes("FUEL")
    ) {
      return "FUEL";
    }

    if (
      upper.includes("ELECTRIC") ||
      upper.includes("POWER")
    ) {
      return "ELECTRICITY";
    }

    if (
      upper.includes("AMAZON") ||
      upper.includes("FLIPKART")
    ) {
      return "PURCHASE";
    }

    if (
      upper.includes("SALARY")
    ) {
      return "SALARY";
    }

    return "UNCATEGORIZED";
  }
}