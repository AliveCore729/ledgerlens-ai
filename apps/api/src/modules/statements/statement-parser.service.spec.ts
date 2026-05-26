import { CategorizationService } from "../intelligence/categorization.service";
import { GeminiService } from "../intelligence/gemini.service";
import { NormalizationService } from "../intelligence/normalization.service";
import { TransactionParserService } from "../intelligence/transaction-parser.service";
import { StatementParserService } from "./statement-parser.service";

describe("StatementParserService", () => {
  let service: StatementParserService;

  beforeEach(() => {
    service = new StatementParserService(
      new TransactionParserService(),
      new NormalizationService(),
      new CategorizationService(),
      new GeminiService(),
    );
  });

  it("groups wrapped OCR text into transactions", async () => {
    const transactions = await service.extractTransactions(`
Post Date Value Date Description Debit Credit Balance
31-03-2026 BROUGHT FORWARD 2,62,905.67CR
04 WDL TFR
03-04-2025 03-04-2025 UPI/DR/509336451702/Spotify 119.00 5,12,786.67CR
/ICIC/spotify.bd/Mand
0097694162092
AT 02069 ACB JAIPATNA
22-04-2025 22-04-2025 UPI/DR/511227073657/Apple Se/ICIC/appleservi/Mand 99.00 5,12,687.67CR
Page no. 1
`);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      amount: 119,
      type: "DEBIT",
      category: "UNCATEGORIZED",
    });
    expect(transactions[1]).toMatchObject({
      amount: 99,
      type: "DEBIT",
    });
  });

  it("extracts Federal Bank rows with glued date and amount columns", async () => {
    const transactions = await service.extractTransactions(`
The Federal Bank Ltd.
DateValue DateParticulars
Tran
Type
Tran ID
WithdrawalsDepositsBalance
Opening Balance272.16Cr
01-APR-202601-APR-2026UPIOUT/645724911500
/q062828104@ybl/Paid via /5814
TFRS3609832180.00192.16Cr
01-APR-202601-APR-2026UPI IN/609130158942
/9668020940@naviaxis/Paid/0000
TFRS367875961500.001692.16Cr
`);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      date: "01-APR-2026",
      amount: 80,
      type: "DEBIT",
    });
    expect(transactions[0].vendor).toContain("UPI OUT");
    expect(transactions[1]).toMatchObject({
      date: "01-APR-2026",
      amount: 1500,
      type: "CREDIT",
    });
  });
});
