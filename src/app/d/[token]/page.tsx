import React from "react";
import type { Metadata } from "next";
import {
  Building2,
  CalendarClock,
  FileText,
  MessageSquareText,
  ShieldAlert,
  User,
} from "lucide-react";
import { ConfirmReceiptBar } from "@/components/receiver/ConfirmReceiptBar";
import { DocumentViewer } from "@/components/receiver/DocumentViewer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  DisposisiStatusBadge,
  SegeraBadge,
} from "@/components/ui/StatusBadge";
import { logAudit } from "@/lib/audit";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { formatTanggalIndo, formatTanggalWaktuIndo } from "@/lib/format";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { hashToken, isValidTokenFormat } from "@/lib/token";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Disposisi Surat — SIDISPO Solo Techno Park",
  robots: { index: false, follow: false },
};

function InvalidTokenView() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-950 text-white px-4 py-4 border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <BrandLogo href="#" dark compact />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-950">
            Tautan Tidak Dapat Diakses
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tautan disposisi ini tidak valid, telah kedaluwarsa, atau aksesnya
            sudah dicabut oleh Sekretariat Solo Techno Park.
          </p>
          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Silakan hubungi Admin Sekretariat STP jika Anda membutuhkan tautan
            baru untuk membuka surat ini.
          </p>
        </div>
      </main>
    </div>
  );
}

export default async function ReceiverDispositionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;

  if (!isSupabaseAdminConfigured() || !isValidTokenFormat(rawToken)) {
    return <InvalidTokenView />;
  }

  const tokenHash = hashToken(rawToken);
  const db = createSupabaseAdmin();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: disposisi } = await db
    .from("disposisi")
    .select(
      "id, surat_id, catatan, token_expires_at, revoked_at, opened_at, confirmed_at, status, surat(kode_arsip, perihal, pengirim, nomor_surat, file_name, file_mime, is_segera, batas_tindak_lanjut), penerima(nama, jabatan, divisi)"
    )
    .eq("token_hash", tokenHash)
    .single();

  if (
    !disposisi ||
    disposisi.revoked_at ||
    new Date(disposisi.token_expires_at) <= now
  ) {
    return <InvalidTokenView />;
  }

  const suratObj = Array.isArray(disposisi.surat)
    ? disposisi.surat[0]
    : disposisi.surat;
  const penerimaObj = Array.isArray(disposisi.penerima)
    ? disposisi.penerima[0]
    : disposisi.penerima;

  if (!suratObj || !penerimaObj) {
    return <InvalidTokenView />;
  }

  // Record first open atomically without overwriting opened_at (PRD §7.1)
  const { data: firstOpenRows } = await db
    .from("disposisi")
    .update({ opened_at: nowIso, updated_at: nowIso })
    .eq("id", disposisi.id)
    .is("opened_at", null)
    .select("id");

  await logAudit({
    suratId: disposisi.surat_id,
    disposisiId: disposisi.id,
    eventType:
      firstOpenRows && firstOpenRows.length > 0
        ? "LINK_OPENED"
        : "LINK_OPENED_REPEAT",
    eventData: { accessedAt: nowIso },
  }).catch(() => {});

  const fileUrl = `/api/files/${encodeURIComponent(rawToken)}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 bg-slate-950 text-white border-b border-slate-800 px-4 py-3.5 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <BrandLogo href="#" dark compact />
          <span className="font-mono text-[11px] font-bold bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg text-amber-300 shrink-0">
            {suratObj.kode_arsip}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>
                Kepada:{" "}
                <strong className="text-slate-950">{penerimaObj.nama}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {suratObj.is_segera && <SegeraBadge />}
              <DisposisiStatusBadge status={disposisi.status} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Perihal Surat
            </p>
            <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-snug mt-0.5">
              {suratObj.perihal}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Pengirim
              </p>
              <p className="text-xs font-extrabold text-slate-900 mt-1">
                {suratObj.pengirim}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Nomor Surat
              </p>
              <p className="text-xs font-extrabold font-mono text-slate-900 mt-1">
                {suratObj.nomor_surat || "-"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                <CalendarClock className="w-3 h-3" /> Batas Tindak Lanjut
              </p>
              <p className="text-xs font-extrabold text-slate-900 mt-1">
                {suratObj.batas_tindak_lanjut
                  ? formatTanggalIndo(suratObj.batas_tindak_lanjut)
                  : "Tidak ditentukan"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <MessageSquareText className="w-3.5 h-3.5 text-amber-600" />
              Instruksi / Catatan Disposisi
            </p>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
              {disposisi.catatan.trim() ||
                "Mohon untuk diketahui dan ditindaklanjuti sesuai bidang terkait."}
            </p>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Tautan akses ini berlaku hingga{" "}
            <strong className="text-slate-600">
              {formatTanggalWaktuIndo(disposisi.token_expires_at)}
            </strong>
            . Dokumen fisik asli disimpan di Sekretariat STP dengan kode arsip{" "}
            <strong className="font-mono text-slate-600">
              {suratObj.kode_arsip}
            </strong>
            .
          </p>
        </div>

        <DocumentViewer
          fileUrl={fileUrl}
          fileMime={suratObj.file_mime}
          fileName={suratObj.file_name}
        />
      </main>

      <ConfirmReceiptBar
        rawToken={rawToken}
        initialConfirmedAt={disposisi.confirmed_at}
      />
    </div>
  );
}
