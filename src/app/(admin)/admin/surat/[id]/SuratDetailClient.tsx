"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Send,
  ShieldOff,
  CalendarPlus,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Clock,
  History,
  BellRing,
} from "lucide-react";
import { DocumentViewer } from "@/components/receiver/DocumentViewer";
import { Modal } from "@/components/ui/Modal";
import {
  DisposisiStatusBadge,
  SegeraBadge,
  TokenStateBadge,
  WaStatusBadge,
} from "@/components/ui/StatusBadge";
import {
  formatAuditSummary,
  getAuditEventLabel,
} from "@/lib/audit-format";
import {
  formatFileSize,
  formatTanggalIndo,
  formatTanggalWaktuIndo,
} from "@/lib/format";
import {
  extendTokenAction,
  markReminderSentAction,
  markWaManualSentAction,
  reissueTokenAction,
  revokeTokenAction,
} from "../actions";

export interface SuratDetailData {
  id: string;
  kodeArsip: string;
  divisiNama: string;
  perihal: string;
  pengirim: string;
  nomorSurat: string | null;
  fileName: string;
  fileMime: string;
  fileSize: number;
  isSegera: boolean;
  batasTindakLanjut: string | null;
  createdAt: string;
  createdByNama: string;
  canManage: boolean;
  disposisi: Array<{
    id: string;
    penerimaNama: string;
    penerimaJabatan: string;
    penerimaDivisi: string;
    penerimaNoWa: string;
    catatan: string;
    tokenVersion: number;
    tokenExpiresAt: string;
    isExpired: boolean;
    revokedAt: string | null;
    waStatus: string;
    waSentAt: string | null;
    openedAt: string | null;
    confirmedAt: string | null;
    status: string;
    reminderSentAt: string | null;
    createdAt: string;
    waMeReminderUrl: string;
  }>;
  auditLogs: Array<{
    id: string;
    eventType: string;
    actorEmail: string | null;
    eventData: string | null;
    createdAt: string;
  }>;
}

export function SuratDetailClient({ surat }: { surat: SuratDetailData }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [extendTarget, setExtendTarget] = useState<string | null>(null);
  const [extraDays, setExtraDays] = useState(14);
  const [reissueResult, setReissueResult] = useState<{
    penerimaNama: string;
    waMeUrl: string;
    linkUrl: string;
    newExpiresAt: string;
    disposisiId: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleMarkSent = (disposisiId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await markWaManualSentAction(disposisiId);
      setFeedback(
        res.ok
          ? { type: "ok", text: "Status WhatsApp ditandai terkirim manual." }
          : { type: "error", text: res.error || "Gagal memperbarui status." }
      );
    });
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await revokeTokenAction(revokeTarget);
      setRevokeTarget(null);
      setFeedback(
        res.ok
          ? { type: "ok", text: "Tautan penerima berhasil dinonaktifkan." }
          : { type: "error", text: res.error || "Gagal menonaktifkan tautan." }
      );
    });
  };

  const handleExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await extendTokenAction(extendTarget, extraDays);
      setExtendTarget(null);
      setFeedback(
        res.ok
          ? {
              type: "ok",
              text: `Masa berlaku tautan diperpanjang hingga ${formatTanggalIndo(res.newExpiresAt)}.`,
            }
          : { type: "error", text: res.error || "Gagal memperpanjang masa berlaku." }
      );
    });
  };

  const handleReissue = (disposisiId: string, penerimaNama: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await reissueTokenAction(disposisiId);
      if (!res.ok || !res.waMeUrl || !res.linkUrl) {
        setFeedback({
          type: "error",
          text: res.error || "Gagal menerbitkan ulang token.",
        });
        return;
      }
      setReissueResult({
        penerimaNama,
        waMeUrl: res.waMeUrl,
        linkUrl: res.linkUrl,
        newExpiresAt: res.newExpiresAt || "",
        disposisiId,
      });
    });
  };

  const handleMarkReminded = (disposisiId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await markReminderSentAction(disposisiId);
      setFeedback(
        res.ok
          ? { type: "ok", text: "Pengingat tercatat di riwayat audit." }
          : { type: "error", text: res.error || "Gagal mencatat pengingat." }
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/surat"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Surat</span>
        </Link>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-black text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Lihat Dokumen Scan</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Obsidian Header Card (SIVIKA JadwalDetailModal style) */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-black bg-amber-500 text-slate-950 px-3 py-1 rounded-xl">
              {surat.kodeArsip}
            </span>
            <span className="text-xs font-extrabold bg-white/10 text-slate-200 border border-white/15 px-3 py-1 rounded-xl">
              Divisi {surat.divisiNama}
            </span>
            {surat.isSegera && <SegeraBadge />}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Dicatat oleh <strong className="text-slate-200">{surat.createdByNama}</strong> •{" "}
            {formatTanggalWaktuIndo(surat.createdAt)}
          </span>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Perihal Surat
          </p>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            {surat.perihal}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Pengirim / Instansi
            </p>
            <p className="text-xs font-extrabold text-white mt-1">
              {surat.pengirim}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Nomor Surat
            </p>
            <p className="text-xs font-extrabold font-mono text-white mt-1">
              {surat.nomorSurat || "-"}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Batas Tindak Lanjut
            </p>
            <p className="text-xs font-extrabold text-white mt-1">
              {surat.batasTindakLanjut
                ? formatTanggalIndo(surat.batasTindakLanjut)
                : "-"}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase text-slate-400">
              Berkas Digital
            </p>
            <p className="text-xs font-extrabold text-white mt-1 truncate">
              {surat.fileName} ({formatFileSize(surat.fileSize)})
            </p>
          </div>
        </div>
      </div>

      {!surat.canManage && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-900">
          <strong>Surat Masuk (Mode Lihat Saja):</strong> Surat ini dicatat oleh{" "}
          <strong>Divisi {surat.divisiNama}</strong>. Hanya divisi pengirim atau
          Superadmin yang dapat memperpanjang, membuat ulang, atau menonaktifkan
          tautan.
        </div>
      )}

      {/* Daftar Penerima & Kontrol Token (ADM-07, 08, 09, 10, 12) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">
              Daftar Penerima & Status Tautan ({surat.disposisi.length})
            </h2>
            <p className="text-xs text-slate-500">
              Setiap penerima memiliki tautan surat, status WhatsApp, dan waktu konfirmasi masing-masing.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {surat.disposisi.map((d) => (
            <div key={d.id} className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-950">
                      {d.penerimaNama}
                    </h3>
                    <DisposisiStatusBadge status={d.status} />
                    <WaStatusBadge status={d.waStatus} />
                    <TokenStateBadge
                      revokedAt={d.revokedAt}
                      isExpired={d.isExpired}
                    />
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Tautan #{d.tokenVersion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {d.penerimaJabatan}
                    {d.penerimaDivisi ? ` • ${d.penerimaDivisi}` : ""} •{" "}
                    <span className="font-mono">+{d.penerimaNoWa}</span>
                  </p>
                  {d.catatan && (
                    <p className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200/70 rounded-xl px-3 py-2 mt-2">
                      <strong>Catatan:</strong> {d.catatan}
                    </p>
                  )}
                </div>

                {/* Per-recipient Actions (Owner division & Superadmin only) */}
                {surat.canManage && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {d.waStatus === "PENDING" || d.waStatus === "FAILED" ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleMarkSent(d.id)}
                      className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai WA Terkirim</span>
                    </button>
                  ) : null}

                  {d.status === "BELUM_DIKONFIRMASI" && !d.revokedAt && (
                    <a
                      href={d.waMeReminderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkReminded(d.id)}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Ingatkan WA</span>
                    </a>
                  )}

                  {!d.revokedAt && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setExtraDays(14);
                        setExtendTarget(d.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      title="Perpanjang masa berlaku token lama"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Perpanjang</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReissue(d.id, d.penerimaNama)}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Buat tautan baru & nonaktifkan tautan lama"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Buat Tautan Baru</span>
                  </button>

                  {!d.revokedAt && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setRevokeTarget(d.id)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Nonaktifkan tautan penerima ini"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>Nonaktifkan</span>
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* 4 Main Timestamps (PRD §7.1) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 font-bold block">Dibuat</span>
                  <span className="font-extrabold text-slate-800">
                    {formatTanggalWaktuIndo(d.createdAt)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 font-bold block">WA Dikirim</span>
                  <span className="font-extrabold text-slate-800">
                    {formatTanggalWaktuIndo(d.waSentAt)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 font-bold block">Pertama Dibuka</span>
                  <span className="font-extrabold text-slate-800">
                    {formatTanggalWaktuIndo(d.openedAt)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 font-bold block">Dikonfirmasi</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatTanggalWaktuIndo(d.confirmedAt)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 font-bold block">Tautan Berlaku s.d.</span>
                  <span className="font-extrabold text-slate-800">
                    {formatTanggalIndo(d.tokenExpiresAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail Timeline (ADM-07) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-black text-slate-950">
            Riwayat Aktivitas Surat ({surat.auditLogs.length})
          </h2>
        </div>

        <ol className="relative border-l-2 border-slate-200 ml-2.5 space-y-4 pl-6">
          {surat.auditLogs.map((log) => {
            const summary = formatAuditSummary(log.eventType, log.eventData);
            return (
              <li key={log.id} className="relative">
                <span className="w-3 h-3 rounded-full bg-slate-950 ring-4 ring-white border-2 border-amber-400 absolute -left-[31px] top-1" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {getAuditEventLabel(log.eventType)}
                  </p>
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTanggalWaktuIndo(log.createdAt)}
                  </span>
                </div>
                {log.actorEmail && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Oleh: <span className="font-semibold">{log.actorEmail}</span>
                  </p>
                )}
                {summary !== "-" && (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 mt-1.5">
                    {summary}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Document Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Dokumen Scan — ${surat.kodeArsip}`}
        subtitle={surat.perihal}
        icon={<FileText className="w-5 h-5" />}
        maxWidthClass="max-w-4xl"
      >
        <DocumentViewer
          fileUrl={`/api/admin/files/${surat.id}`}
          fileMime={surat.fileMime}
          fileName={surat.fileName}
        />
      </Modal>

      {/* Extend Token Modal (ADM-12) */}
      <Modal
        open={Boolean(extendTarget)}
        onClose={() => setExtendTarget(null)}
        title="Perpanjang Masa Berlaku Tautan"
        subtitle="Tautan Lama Tetap Berlaku"
        icon={<CalendarPlus className="w-5 h-5" />}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleExtend} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Tambahkan masa berlaku tautan penerima tanpa mengganti link yang sudah dikirim. Perubahan ini tercatat di riwayat surat.
          </p>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
              Tambahan Hari (1 – 180 hari)
            </label>
            <div className="flex gap-2 mb-2.5">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setExtraDays(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    extraDays === d
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  +{d} hari
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={180}
              value={extraDays}
              onChange={(e) => setExtraDays(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setExtendTarget(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-slate-950 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Perpanjangan</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Reissue Result Modal (ADM-12) */}
      <Modal
        open={Boolean(reissueResult)}
        onClose={() => setReissueResult(null)}
        title="Tautan Baru Berhasil Dibuat"
        subtitle="Tautan Lama Sudah Tidak Berlaku"
        icon={<RefreshCw className="w-5 h-5" />}
        maxWidthClass="max-w-lg"
      >
        {reissueResult && (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-700">
              Tautan baru untuk{" "}
              <strong className="text-slate-950">
                {reissueResult.penerimaNama}
              </strong>{" "}
              telah dibuat (berlaku s.d.{" "}
              <strong>{formatTanggalIndo(reissueResult.newExpiresAt)}</strong>).
              Tautan sebelumnya otomatis tidak dapat digunakan lagi.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-slate-800 truncate">
                {reissueResult.linkUrl}
              </code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(reissueResult.linkUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="p-2 rounded-xl bg-slate-950 text-white shrink-0 cursor-pointer"
                title="Salin tautan"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-amber-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <a
                href={reissueResult.waMeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Tautan Baru via WA</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  handleMarkSent(reissueResult.disposisiId);
                  setReissueResult(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs cursor-pointer"
              >
                Tandai Terkirim & Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Confirmation Modal (ADM-10) */}
      <Modal
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Nonaktifkan Tautan Ini?"
        subtitle="Akses Dokumen Akan Ditutup"
        icon={<ShieldOff className="w-5 h-5" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Tautan penerima yang dinonaktifkan tidak akan bisa membuka dokumen
            lagi. Anda tetap dapat membuat tautan baru nanti jika diperlukan.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleRevoke}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Ya, Nonaktifkan</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
