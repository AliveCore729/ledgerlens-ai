import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES } from "./categories";

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        category: z.string().optional(),
        type: z.enum(["debit", "credit"]).optional(),
        search: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(2000).optional(),
      })
      .partial()
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("transactions").select("*").order("txn_date", { ascending: false });
    if (data.category) q = q.eq("category", data.category);
    if (data.type) q = q.eq("txn_type", data.type);
    if (data.search) q = q.ilike("description", `%${data.search}%`);
    q = q.limit(data.limit ?? 1000);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        category: z.enum(CATEGORIES).optional(),
        vendor: z.string().max(200).nullable().optional(),
        is_verified: z.boolean().optional(),
        notes: z.string().max(1000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    const { error } = await supabase
      .from("transactions")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: stmts }, { data: txns }] = await Promise.all([
      supabase.from("statements").select("id, status, transaction_count"),
      supabase
        .from("transactions")
        .select("amount, txn_type, category, txn_date, vendor")
        .order("txn_date", { ascending: false })
        .limit(2000),
    ]);

    const statementCount = stmts?.length ?? 0;
    const completed = (stmts ?? []).filter((s) => s.status === "completed").length;
    const txnCount = (txns ?? []).length;

    let credits = 0;
    let debits = 0;
    const byCategory = new Map<string, number>();
    const byMonth = new Map<string, { credit: number; debit: number }>();
    const categories = new Set<string>();

    for (const t of txns ?? []) {
      const amt = Number(t.amount) || 0;
      if (t.txn_type === "credit") credits += amt;
      else debits += amt;
      if (t.category) {
        categories.add(t.category);
        if (t.txn_type === "debit") {
          byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amt);
        }
      }
      const m = (t.txn_date ?? "").slice(0, 7);
      if (m) {
        const cur = byMonth.get(m) ?? { credit: 0, debit: 0 };
        if (t.txn_type === "credit") cur.credit += amt;
        else cur.debit += amt;
        byMonth.set(m, cur);
      }
    }

    const monthly = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, v]) => ({ month, ...v, net: v.credit - v.debit }));

    const topCategories = Array.from(byCategory.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([category, amount]) => ({ category, amount }));

    return {
      statementCount,
      completedCount: completed,
      transactionCount: txnCount,
      categoryCount: categories.size,
      totalCredits: credits,
      totalDebits: debits,
      net: credits - debits,
      monthly,
      topCategories,
    };
  });
