"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

type AuthMode = "login" | "register";

type Transaction = {
  id?: string;
  date: string;
  amount: number;
  type: string;
  vendor: string | null;
  normalizedVendor: string | null;
  category: string | null;
};

type DashboardSummary = {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  uncategorized: number;
  categoryBreakdown: Array<{
    category: string;
    income: number;
    expense: number;
    count: number;
  }>;
  monthlyCashflow: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  topVendors: Array<{
    vendor: string;
    amount: number;
    count: number;
  }>;
  recentTransactions: Transaction[];
};

const emptySummary: DashboardSummary = {
  totalTransactions: 0,
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  uncategorized: 0,
  categoryBreakdown: [],
  monthlyCashflow: [],
  topVendors: [],
  recentTransactions: [],
};

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("password123");
  const [firstName, setFirstName] = useState("Shreyansh");
  const [lastName, setLastName] = useState("Jain");
  const [token, setToken] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [status, setStatus] = useState("Connect your API session to begin.");
  const [isBusy, setIsBusy] = useState(false);

  const netTone = summary.balance >= 0 ? "text-emerald-700" : "text-rose-700";

  const maxCategoryAmount = useMemo(
    () =>
      Math.max(
        1,
        ...summary.categoryBreakdown.map(
          (item) => item.expense + item.income,
        ),
      ),
    [summary.categoryBreakdown],
  );

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setStatus(authMode === "login" ? "Signing in..." : "Creating account...");

    try {
      const response = await fetch(`${API_BASE}/auth/${authMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthMode("login");
        setStatus("Account created. Sign in to continue.");
        return;
      }

      setToken(data.accessToken);
      setStatus("Signed in. Loading analytics...");
      await loadSummary(data.accessToken);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function uploadStatement() {
    if (!selectedFile || !token) {
      setStatus("Select a statement and sign in first.");
      return;
    }

    setIsBusy(true);
    setStatus("Uploading and parsing statement...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE}/uploads/statement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setStatus(
        `Processed ${data.transactions.length} preview transactions. Refreshing dashboard...`,
      );
      await loadSummary(token);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function loadSummary(activeToken = token) {
    if (!activeToken) {
      return;
    }

    const response = await fetch(`${API_BASE}/analytics/summary`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load analytics");
    }

    setSummary(data);
    setStatus("Dashboard updated.");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] || null);
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#15181e]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-[#d8dee8] pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#647084]">LedgerLens AI</p>
            <h1 className="text-3xl font-semibold tracking-normal text-[#15181e]">
              Statement intelligence workspace
            </h1>
          </div>
          <div className="text-sm text-[#647084]">{status}</div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-[#d8dee8] bg-white p-4">
            <div className="mb-4 flex rounded-md border border-[#d8dee8] p-1">
              <button
                className={`h-9 flex-1 rounded text-sm font-medium ${
                  authMode === "login"
                    ? "bg-[#202734] text-white"
                    : "text-[#526071]"
                }`}
                onClick={() => setAuthMode("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`h-9 flex-1 rounded text-sm font-medium ${
                  authMode === "register"
                    ? "bg-[#202734] text-white"
                    : "text-[#526071]"
                }`}
                onClick={() => setAuthMode("register")}
                type="button"
              >
                Register
              </button>
            </div>

            <form className="space-y-3" onSubmit={submitAuth}>
              {authMode === "register" ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm font-medium text-[#526071]">
                    First name
                    <input
                      className="mt-1 h-10 w-full rounded-md border border-[#cbd3df] px-3 text-[#15181e] outline-none focus:border-[#202734]"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium text-[#526071]">
                    Last name
                    <input
                      className="mt-1 h-10 w-full rounded-md border border-[#cbd3df] px-3 text-[#15181e] outline-none focus:border-[#202734]"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}

              <label className="block text-sm font-medium text-[#526071]">
                Email
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[#cbd3df] px-3 text-[#15181e] outline-none focus:border-[#202734]"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="block text-sm font-medium text-[#526071]">
                Password
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[#cbd3df] px-3 text-[#15181e] outline-none focus:border-[#202734]"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <button
                className="h-10 w-full rounded-md bg-[#202734] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98a2b3]"
                disabled={isBusy}
                type="submit"
              >
                {authMode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#e1e6ee] pt-4">
              <label className="block text-sm font-medium text-[#526071]">
                Bank statement
                <input
                  className="mt-1 block w-full rounded-md border border-[#cbd3df] bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#eef2f7] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#202734]"
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={onFileChange}
                />
              </label>
              <button
                className="mt-3 h-10 w-full rounded-md bg-[#256d85] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#98a2b3]"
                disabled={isBusy || !token || !selectedFile}
                onClick={uploadStatement}
                type="button"
              >
                Process statement
              </button>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Transactions" value={summary.totalTransactions} />
              <Metric label="Income" value={formatMoney(summary.totalIncome)} />
              <Metric label="Expense" value={formatMoney(summary.totalExpense)} />
              <Metric
                label="Net"
                value={formatMoney(summary.balance)}
                valueClassName={netTone}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <section className="rounded-lg border border-[#d8dee8] bg-white">
                <div className="border-b border-[#e1e6ee] px-4 py-3">
                  <h2 className="text-base font-semibold">Recent transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead className="bg-[#f1f4f8] text-xs uppercase text-[#647084]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Vendor</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentTransactions.map((transaction, index) => (
                        <tr
                          className="border-t border-[#edf0f4]"
                          key={`${transaction.date}-${transaction.amount}-${index}`}
                        >
                          <td className="px-4 py-3 text-[#526071]">
                            {transaction.date}
                          </td>
                          <td className="max-w-[280px] truncate px-4 py-3">
                            {transaction.vendor || "Unknown"}
                          </td>
                          <td className="px-4 py-3">
                            {transaction.category || "UNCATEGORIZED"}
                          </td>
                          <td className="px-4 py-3">{transaction.type}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatMoney(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border border-[#d8dee8] bg-white p-4">
                <h2 className="text-base font-semibold">Category breakdown</h2>
                <div className="mt-4 space-y-3">
                  {summary.categoryBreakdown.slice(0, 8).map((item) => {
                    const total = item.expense + item.income;

                    return (
                      <div key={item.category}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium">
                            {item.category}
                          </span>
                          <span className="text-[#647084]">
                            {formatMoney(total)}
                          </span>
                        </div>
                        <div className="h-2 rounded bg-[#edf0f4]">
                          <div
                            className="h-2 rounded bg-[#256d85]"
                            style={{
                              width: `${Math.max(4, (total / maxCategoryAmount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Monthly cashflow">
                <div className="space-y-3">
                  {summary.monthlyCashflow.map((month) => (
                    <div
                      className="grid grid-cols-[90px_1fr_1fr_1fr] gap-2 text-sm"
                      key={month.month}
                    >
                      <span className="font-medium">{month.month}</span>
                      <span className="text-emerald-700">
                        {formatMoney(month.income)}
                      </span>
                      <span className="text-rose-700">
                        {formatMoney(month.expense)}
                      </span>
                      <span>{formatMoney(month.net)}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Top vendors">
                <div className="space-y-3">
                  {summary.topVendors.map((vendor) => (
                    <div
                      className="flex items-center justify-between gap-3 text-sm"
                      key={vendor.vendor}
                    >
                      <span className="truncate font-medium">{vendor.vendor}</span>
                      <span className="shrink-0 text-[#647084]">
                        {vendor.count} tx · {formatMoney(vendor.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-[#d8dee8] bg-white p-4">
      <div className="text-sm font-medium text-[#647084]">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#d8dee8] bg-white p-4">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
