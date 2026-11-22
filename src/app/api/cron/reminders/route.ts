import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import {
  getReminderDaysBefore,
  getWaMode,
  isSupabaseAdminConfigured,
} from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildReminderMessage,
  sendWhatsAppNotification,
} from "@/lib/wa/provider";

function verifySecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!verifySecret(token, cronSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase secret key belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const db = createSupabaseAdmin();
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + getReminderDaysBefore());

  const { data: pending } = await db
    .from("disposisi")
    .select(
      "id, surat_id, token_expires_at, surat(kode_arsip, perihal), penerima(nama, no_wa)"
    )
    .eq("status", "BELUM_DIKONFIRMASI")
    .is("revoked_at", null)
    .is("reminder_sent_at", null)
    .gt("token_expires_at", now.toISOString())
    .lte("token_expires_at", cutoff.toISOString())
    .limit(50);

  const items = pending ?? [];
  const waMode = getWaMode();

  if (waMode === "manual") {
    return NextResponse.json({
      ok: true,
      mode: "manual",
      queuedForDashboard: items.length,
    });
  }

  let sentCount = 0;
  for (const d of items) {
    const suratObj = Array.isArray(d.surat) ? d.surat[0] : d.surat;
    const penerimaObj = Array.isArray(d.penerima) ? d.penerima[0] : d.penerima;
    if (!suratObj || !penerimaObj) continue;

    const msg = buildReminderMessage({
      namaPenerima: penerimaObj.nama,
      kodeArsip: suratObj.kode_arsip,
      perihal: suratObj.perihal,
      expiresAt: new Date(d.token_expires_at),
    });

    const result = await sendWhatsAppNotification(penerimaObj.no_wa, msg);
    if (result.ok) {
      const nowIso = new Date().toISOString();
      await db
        .from("disposisi")
        .update({ reminder_sent_at: nowIso, updated_at: nowIso })
        .eq("id", d.id);

      await logAudit({
        suratId: d.surat_id,
        disposisiId: d.id,
        eventType: "REMINDER_SENT",
        eventData: { provider: result.provider, mode: waMode },
      });
      sentCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    mode: waMode,
    checked: items.length,
    sent: sentCount,
  });
}
