import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { extractStatement } from "./ai-gateway.server";

// Create a statement row after the file has been uploaded to storage by the client.
export const createStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        fileName: z.string().min(1).max(255),
        storagePath: z.string().min(1).max(500),
        mimeType: z.string().min(1).max(100),
        fileSize: z.number().int().min(0).max(50 * 1024 * 1024),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("statements")
      .insert({
        user_id: userId,
        file_name: data.fileName,
        storage_path: data.storagePath,
        mime_type: data.mimeType,
        file_size: data.fileSize,
        status: "uploaded",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

// Run extraction + categorization. Idempotent-ish: if already completed, no-op.
export const processStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { id } = data;

    // Load statement row (use admin to bypass RLS edge cases)
    const { data: stmt, error: stmtErr } = await supabaseAdmin
      .from("statements")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (stmtErr || !stmt) throw new Error("Statement not found");
    if (stmt.status === "completed") return { ok: true, transaction_count: stmt.transaction_count };

    await supabaseAdmin
      .from("statements")
      .update({ status: "processing", error_message: null })
      .eq("id", id);

    try {
      // Download file from storage
      const { data: file, error: dlErr } = await supabaseAdmin.storage
        .from("statements")
        .download(stmt.storage_path);
      if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message ?? "unknown"}`);

      const buf = new Uint8Array(await file.arrayBuffer());
      const mime = stmt.mime_type || file.type || "application/pdf";

      // Extract via AI
      const result = await extractStatement(buf, mime, stmt.file_name);

      // Insert transactions
      let credits = 0;
      let debits = 0;
      const rows = result.transactions.map((t) => {
        const amount = Math.abs(Number(t.amount) || 0);
        if (t.type === "credit") credits += amount;
        else debits += amount;
        return {
          user_id: userId,
          statement_id: id,
          txn_date: t.date,
          description: t.description.slice(0, 1000),
          amount,
          txn_type: t.type,
          balance: t.balance ?? null,
          reference: t.reference?.slice(0, 200) ?? null,
          category: t.category ?? null,
          vendor: t.vendor?.slice(0, 200) ?? null,
          ai_confidence: t.confidence ?? null,
        };
      });

      if (rows.length > 0) {
        const { error: insErr } = await supabaseAdmin.from("transactions").insert(rows);
        if (insErr) throw new Error(`Insert failed: ${insErr.message}`);
      }

      await supabaseAdmin
        .from("statements")
        .update({
          status: "completed",
          bank_name: result.bank_name ?? null,
          account_number: result.account_number ?? null,
          period_start: result.period_start ?? null,
          period_end: result.period_end ?? null,
          opening_balance: result.opening_balance ?? null,
          closing_balance: result.closing_balance ?? null,
          total_credits: credits,
          total_debits: debits,
          transaction_count: rows.length,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);

      return { ok: true, transaction_count: rows.length };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("statements")
        .update({ status: "failed", error_message: msg.slice(0, 1000) })
        .eq("id", id);
      throw new Error(msg);
    }
  });

export const listStatements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("statements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getStatement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [stmt, txns] = await Promise.all([
      supabase.from("statements").select("*").eq("id", data.id).single(),
      supabase
        .from("transactions")
        .select("*")
        .eq("statement_id", data.id)
        .order("txn_date", { ascending: false }),
    ]);
    if (stmt.error) throw new Error(stmt.error.message);
    return { statement: stmt.data, transactions: txns.data ?? [] };
  });

export const deleteStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // fetch to get storage path
    const { data: stmt } = await supabase
      .from("statements")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (stmt?.storage_path) {
      await supabaseAdmin.storage.from("statements").remove([stmt.storage_path]);
    }
    const { error } = await supabase
      .from("statements")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
