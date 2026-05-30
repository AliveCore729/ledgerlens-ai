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
      type: "debit",
      category: "UNCATEGORIZED",
    });
    expect(transactions[1]).toMatchObject({
      amount: 99,
      type: "debit",
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
      type: "debit",
    });
    expect(transactions[0].vendor).toContain("UPI OUT");
    expect(transactions[1]).toMatchObject({
      date: "01-APR-2026",
      amount: 1500,
      type: "credit",
    });
  });

  it("parses layout-preserved Federal Bank tables by row instead of bank-specific token routing", async () => {
    const transactions = await service.extractTransactions(`
                                   Statement of Account for the period 2026-05-10 to 2026-05-20
    Date           Value Date                Particulars                                 Tran ID                           Withdrawals       Deposits      Balance
                                Opening Balance                                                                                                               17.33        Cr

10-MAY-2026       10-MAY-2026   UPI IN/018593982703/dkjksng@axl              TFR           S53407102                                           7125.00      7142.33        Cr
10-MAY-2026       10-MAY-2026   UPIOUT/613055070315/cf.                      TFR           S53408571                             7125.40                      16.93        Cr
11-MAY-2026       11-MAY-2026   UPI IN/180747739589/dkjksng@ybl              TFR           S67149889                                              723.00     739.93        Cr
11-MAY-2026       11-MAY-2026   UPIOUT/613184998211/7205925193-              TFR           S67247761                              723.00                      16.93        Cr
`);

    expect(transactions).toHaveLength(4);
    expect(transactions.map((tx) => tx.amount)).toEqual([7125, 7125.4, 723, 723]);
    expect(transactions.map((tx) => tx.type)).toEqual(["credit", "debit", "credit", "debit"]);
  });

  it("handles large OCR statements without skipping merged transaction rows", async () => {
    const transactions = await service.extractTransactions(`
Post Date Value Date Description Debit Credit Balance
01-04-2026 01-04-2026 UPI/DR/700000111111/SWIGGY /ICIC/swiggy/food 249.00 50,000.00CR
01-04-2026 01-04-2026 UPI/DR/700000111112/AMAZON PAY /ICIC/amazon/mand 1,299.00 48,701.00CR 02-04-2026 02-04-2026 NEFT CR ACME PAYROLL 35,000.00 83,701.00CR
03-04-2026 03-04-2026 UPI/DR/700000111113/HPCL PETROL PUMP 2,000.00 81,701.00CR
03-04-2026 03-04-2026 IMPS CR CLIENT REFUND 5,500.00 87,201.00CR
04-04-2026 04-04-2026 UPI/DR/700000111114/BESCOM ELECTRICITY BILL 1,850.00 85,351.00CR
Page no. 2
`);

    expect(transactions).toHaveLength(6);

    expect(transactions.map((tx) => tx.amount)).toEqual(
      expect.arrayContaining([249, 1299, 35000, 2000, 5500, 1850]),
    );

    expect(transactions.filter((tx) => tx.type === "credit")).toHaveLength(2);
    expect(transactions.filter((tx) => tx.type === "debit")).toHaveLength(4);

    const categories = transactions.map((tx) => tx.category);
    expect(categories).toEqual(expect.arrayContaining(["FOOD", "PURCHASE", "SALARY", "FUEL", "ELECTRICITY"]));
  });

  it("does not route non-federal TFR rows to federal parser", async () => {
    const transactions = await service.extractTransactions(`
Date Value Date Description Debit Credit Balance
01-05-2026 01-05-2026 WDL TFR / ATM CASH 301.00 2,239.64CR
02-05-2026 02-05-2026 WDL TFR / ATM CASH 1000.00 1,239.64CR
03-05-2026 03-05-2026 DEP TFR / CASH DEPOSIT 589.00 1,828.64CR
`);

    expect(transactions).toHaveLength(3);
    expect(transactions.map((tx) => tx.amount)).toEqual([301, 1000, 589]);
    expect(transactions.map((tx) => tx.type)).toEqual(["debit", "debit", "credit"]);
  });

  it("corrects amount and type from trailing balance movement when OCR columns are noisy", async () => {
    const transactions = await service.extractTransactions(`
Date Description Debit Credit Balance
10-05-2026 UPI TXN 301.00 2,239.64CR
11-05-2026 UPI TXN 1000.00 1,239.64CR
12-05-2026 UPI TXN 589.00 1,828.64CR
`);

    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toMatchObject({ amount: 301, type: "unknown" });
    expect(transactions[1]).toMatchObject({ amount: 1000, type: "debit" });
    expect(transactions[2]).toMatchObject({ amount: 589, type: "credit" });
  });
});
