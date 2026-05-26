import { TransactionParserService } from "./transaction-parser.service";

describe("TransactionParserService", () => {
  let service: TransactionParserService;

  beforeEach(() => {
    service = new TransactionParserService();
  });

  it("parses SBI OCR rows with debit and balance columns", () => {
    const result = service.parseTransaction(
      "03-04-2025 03-04-2025 UPI/DR/509336451702/Spotify /ICIC/spotify.bd/Mand 119.00 5,12,786.67CR",
    );

    expect(result).toMatchObject({
      date: "03-04-2025",
      amount: 119,
      type: "DEBIT",
    });
    expect(result?.vendor).toContain("Spotify");
  });

  it("parses comma separated credit amounts without using balance as amount", () => {
    const result = service.parseTransaction(
      "03-04-2025 03-04-2025 INB E-Individual Cancellation 2,60,000.00 5,12,905.67CR",
    );

    expect(result).toMatchObject({
      date: "03-04-2025",
      amount: 260000,
      type: "CREDIT",
    });
  });

  it("supports slash date formats", () => {
    const result = service.parseTransaction(
      "12/05/2025 NEFT CR RAMESH TRADERS 15,500.00 32,010.50CR",
    );

    expect(result).toMatchObject({
      date: "12/05/2025",
      amount: 15500,
      type: "CREDIT",
    });
  });

  it("handles OCR comma decimals", () => {
    const result = service.parseTransaction(
      "03-04-2025 UPI/DR/509336451702/Spotify 119,00 5,12,786.67CR",
    );

    expect(result).toMatchObject({
      amount: 119,
      type: "DEBIT",
    });
  });
});
