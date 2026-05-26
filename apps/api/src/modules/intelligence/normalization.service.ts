import { Injectable } from "@nestjs/common";

import stringSimilarity from "string-similarity";

@Injectable()
export class NormalizationService {
  private knownVendors: string[] = [];

  normalizeVendor(vendor: string | null) {
  if (!vendor) {
    return "UNKNOWN";
  }

  const upper =
    vendor.toUpperCase();

  return upper
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();
}
}