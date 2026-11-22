"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { hashToken, isValidTokenFormat } from "@/lib/token";

export interface ConfirmResult {
  ok: boolean;
  alreadyConfirmed?: boolean;
  confirmedAt?: string;
  error?: string;
}

export async function confirmReceiptAction(
  rawToken: string
): Promise<ConfirmResult> {
  if (!isValidTokenFormat(rawToken)) {
    return { ok: false, error: "Tautan tidak valid." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const rl = checkRateLimit(`confirm:${ip}`, 30, 60 * 1000);
  if (!rl.allowed) {
    return {
      ok: false,
      error: "Terlalu banyak permintaan. Silakan coba sesaat lagi.",
    };
  }

  const tokenHash = hashToken(rawToken);
  const db = createSupabaseAdmin();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: existing } = await db
    .from("disposisi")
    .select("id, surat_id, revoked_at, token_expires_at, confirmed_at")
    .eq("token_hash", tokenHash)
    .single();

  if (
    !existing ||
    existing.revoked_at ||
    new Date(existing.token_expires_at) <= now
  ) {
    return {
      ok: false,
      error: "Tautan tidak berlaku, sudah dicabut, atau telah kedaluwarsa.",
    };
  }

  if (existing.confirmed_at) {
    return {
      ok: true,
      alreadyConfirmed: true,
      confirmedAt: existing.confirmed_at,
    };
  }

  // Atomic idempotent update: only updates if confirmed_at IS NULL
  const { data: updatedRows } = await db
    .from("disposisi")
    .update({
      confirmed_at: nowIso,
      status: "SUDAH_DIKONFIRMASI",
      updated_at: nowIso,
    })
    .eq("id", existing.id)
    .is("confirmed_at", null)
    .is("revoked_at", null)
    .gt("token_expires_at", nowIso)
    .select("id");

  if (updatedRows && updatedRows.length === 1) {
    await logAudit({
      suratId: existing.surat_id,
      disposisiId: existing.id,
      eventType: "CONFIRMED",
      eventData: { confirmedAt: nowIso },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/surat");
    revalidatePath(`/admin/surat/${existing.surat_id}`);
    return { ok: true, alreadyConfirmed: false, confirmedAt: nowIso };
  }

  const { data: latest } = await db
    .from("disposisi")
    .select("confirmed_at")
    .eq("id", existing.id)
    .single();

  return {
    ok: true,
    alreadyConfirmed: true,
    confirmedAt: latest?.confirmed_at ?? nowIso,
  };
}
