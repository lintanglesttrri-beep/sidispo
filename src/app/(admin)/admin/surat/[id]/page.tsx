import React from "react";
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildReminderMessage, buildWaMeUrl } from "@/lib/wa/provider";
import {
  SuratDetailClient,
  type SuratDetailData,
} from "./SuratDetailClient";

export const metadata = {
  title: "Detail Surat & Disposisi — SIDISPO",
};

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createSupabaseAdmin();

  const [suratRes, dispRes, auditRes] = await Promise.all([
    db
      .from("surat")
      .select(
        "id, kode_arsip, perihal, pengirim, nomor_surat, file_name, file_mime, file_size, is_segera, batas_tindak_lanjut, created_at, profiles(nama)"
      )
      .eq("id", id)
      .single(),
    db
      .from("disposisi")
      .select(
        "id, catatan, token_version, token_expires_at, revoked_at, wa_status, wa_sent_at, opened_at, confirmed_at, status, reminder_sent_at, created_at, penerima(nama, jabatan, divisi, no_wa)"
      )
      .eq("surat_id", id)
      .order("created_at", { ascending: true }),
    db
      .from("audit_logs")
      .select("id, event_type, actor_email, event_data, created_at")
      .eq("surat_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const surat = suratRes.data;
  if (!surat) {
    notFound();
  }

  const creator = Array.isArray(surat.profiles)
    ? surat.profiles[0]
    : surat.profiles;
  const now = new Date();

  const data: SuratDetailData = {
    id: surat.id,
    kodeArsip: surat.kode_arsip,
    perihal: surat.perihal,
    pengirim: surat.pengirim,
    nomorSurat: surat.nomor_surat,
    fileName: surat.file_name,
    fileMime: surat.file_mime,
    fileSize: surat.file_size,
    isSegera: surat.is_segera,
    batasTindakLanjut: surat.batas_tindak_lanjut,
    createdAt: surat.created_at,
    createdByNama: creator?.nama || "Admin Sekretariat",
    disposisi: (dispRes.data ?? []).map((d) => {
      const p = Array.isArray(d.penerima) ? d.penerima[0] : d.penerima;
      const expDate = new Date(d.token_expires_at);
      const reminderMsg = buildReminderMessage({
        namaPenerima: p?.nama || "Penerima",
        kodeArsip: surat.kode_arsip,
        perihal: surat.perihal,
        expiresAt: expDate,
      });
      return {
        id: d.id,
        penerimaNama: p?.nama || "-",
        penerimaJabatan: p?.jabatan || "-",
        penerimaDivisi: p?.divisi || "",
        penerimaNoWa: p?.no_wa || "",
        catatan: d.catatan,
        tokenVersion: d.token_version,
        tokenExpiresAt: d.token_expires_at,
        isExpired: expDate <= now,
        revokedAt: d.revoked_at,
        waStatus: d.wa_status,
        waSentAt: d.wa_sent_at,
        openedAt: d.opened_at,
        confirmedAt: d.confirmed_at,
        status: d.status,
        reminderSentAt: d.reminder_sent_at,
        createdAt: d.created_at,
        waMeReminderUrl: buildWaMeUrl(p?.no_wa || "", reminderMsg),
      };
    }),
    auditLogs: (auditRes.data ?? []).map((l) => ({
      id: l.id,
      eventType: l.event_type,
      actorEmail: l.actor_email,
      eventData: l.event_data ? JSON.stringify(l.event_data) : null,
      createdAt: l.created_at,
    })),
  };

  return <SuratDetailClient surat={data} />;
}
