import * as XLSX from "xlsx";

type Txn = {
  txn_date: string;
  description: string;
  amount: number | string;
  txn_type: string;
  balance: number | string | null;
  category: string | null;
  vendor: string | null;
  reference: string | null;
};

function toRows(transactions: Txn[]) {
  return transactions.map((t) => ({
    Date: t.txn_date,
    Description: t.description,
    Vendor: t.vendor ?? "",
    Category: t.category ?? "",
    Type: t.txn_type,
    Amount: Number(t.amount),
    Balance: t.balance == null ? "" : Number(t.balance),
    Reference: t.reference ?? "",
  }));
}

function safeName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]/g, "_");
}

export function exportTransactionsToCsv(transactions: Txn[], fileName: string) {
  const rows = toRows(transactions);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${safeName(fileName)}.csv`);
}

export function exportTransactionsToXlsx(transactions: Txn[], fileName: string) {
  const rows = toRows(transactions);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${safeName(fileName)}.xlsx`,
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
