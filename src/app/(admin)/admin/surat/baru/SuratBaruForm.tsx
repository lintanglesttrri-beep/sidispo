"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  FilePlus2,
  Upload,
  FileText,
  X,
  Search,
  Check,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Copy,
  Send,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  createSuratDisposisiAction,
  markWaManualSentAction,
  type CreatedRecipientDispatch,
} from "../actions";

export interface PenerimaOption {
  id: string;
  nama: string;
  jabatan: string;
  divisi: string;
  noWa: string;
}

export function SuratBaruForm({
  penerimaList,
  maxUploadMb,
}: {
  penerimaList: PenerimaOption[];
  maxUploadMb: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [perihal, setPerihal] = useState("");
  const [pengirim, setPengirim] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [isSegera, setIsSegera] = useState(false);
  const [batasTindakLanjut, setBatasTindakLanjut] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Success screen state
  const [createdResult, setCreatedResult] = useState<{
    suratId: string;
    kodeArsip: string;
    perihal: string;
    dispatches: CreatedRecipientDispatch[];
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [markedSentIds, setMarkedSentIds] = useState<Record<string, boolean>>({});

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return penerimaList;
    return penerimaList.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.jabatan.toLowerCase().includes(q) ||
        p.divisi.toLowerCase().includes(q)
    );
  }, [penerimaList, recipientSearch]);

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Silakan unggah berkas scan surat (PDF, JPG, atau PNG).");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Minimal pilih satu penerima disposisi.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("perihal", perihal);
    fd.append("pengirim", pengirim);
    if (nomorSurat.trim()) fd.append("nomorSurat", nomorSurat.trim());
    fd.append("isSegera", String(isSegera));
    if (batasTindakLanjut) fd.append("batasTindakLanjut", batasTindakLanjut);
    fd.append("catatan", catatan);
    for (const id of selectedIds) {
      fd.append("penerimaIds", id);
    }

    startTransition(async () => {
      const res = await createSuratDisposisiAction(fd);
      if (!res.ok || !res.kodeArsip || !res.suratId) {
        setError(res.error || "Gagal menyimpan surat dan disposisi.");
        return;
      }
      setCreatedResult({
        suratId: res.suratId,
        kodeArsip: res.kodeArsip,
        perihal: res.perihal || perihal,
        dispatches: res.dispatches || [],
      });
    });
  };

  const handleCopyKode = async () => {
    if (!createdResult) return;
    await navigator.clipboard.writeText(createdResult.kodeArsip);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleMarkSent = (disposisiId: string) => {
    startTransition(async () => {
      const res = await markWaManualSentAction(disposisiId);
      if (res.ok) {
        setMarkedSentIds((prev) => ({ ...prev, [disposisiId]: true }));
      }
    });
  };

  if (createdResult) {
    return (
      <div className="space-y-6 animate-card-enter">
        {/* Highlight Kode Arsip Banner (PRD §4.2: Pengarsipan dokumen fisik) */}
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Surat & Disposisi Tersimpan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Tuliskan Kode Arsip Berikut pada Surat Fisik Asli:
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Simpan surat fisik di ordner/lemari sekretariat sesuai urutan kode arsip.
              </p>
            </div>

            <div className="bg-white/10 border border-amber-400/40 rounded-2xl px-6 py-4 flex items-center gap-4 shrink-0">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                  Kode Arsip Resmi
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                  {createdResult.kodeArsip}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyKode}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer"
                title="Salin Kode Arsip"
              >
                {copiedCode ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Distribusi WhatsApp per Penerima */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                Kirim Notifikasi WhatsApp ke Penerima ({createdResult.dispatches.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Klik <strong>Kirim via WhatsApp</strong> untuk membuka pesan yang sudah terisi tautan surat, lalu klik <strong>Tandai Terkirim</strong> agar tercatat di riwayat.
              </p>
            </div>
            <Link
              href={`/admin/surat/${createdResult.suratId}`}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Buka Halaman Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {createdResult.dispatches.map((d) => {
              const isSent = markedSentIds[d.disposisiId] || d.waStatus === "SENT";
              return (
                <div
                  key={d.disposisiId}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-extrabold text-sm text-slate-950">
                      {d.namaPenerima}
                    </p>
                    <p className="text-xs text-slate-500">
                      {d.jabatan} • <span className="font-mono">+{d.noWa}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(d.linkUrl);
                        setCopiedLinkId(d.disposisiId);
                        setTimeout(() => setCopiedLinkId(null), 2000);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Salin tautan khusus penerima"
                    >
                      {copiedLinkId === d.disposisiId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Tautan</span>
                        </>
                      )}
                    </button>

                    <a
                      href={d.waMeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim via WhatsApp</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    {isSent ? (
                      <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tercatat Terkirim</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkSent(d.disposisiId)}
                        className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Tandai Terkirim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setCreatedResult(null);
                setFile(null);
                setPerihal("");
                setPengirim("");
                setNomorSurat("");
                setIsSegera(false);
                setBatasTindakLanjut("");
                setCatatan("");
                setSelectedIds([]);
                setMarkedSentIds({});
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
            >
              + Input Surat Lainnya
            </button>
            <Link
              href="/admin/surat"
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs"
            >
              Kembali ke Monitoring Surat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Pencatatan & Distribusi"
        badgeIcon={<FilePlus2 className="w-3.5 h-3.5 text-slate-700" />}
        title="Catat Surat & Kirim Disposisi"
        description="Unggah hasil scan surat, lengkapi informasi surat, pilih penerima, dan tulis catatan arahan dalam satu halaman."
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File & Metadata */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              1. Berkas Scan Surat (PDF / JPG / PNG) *
            </label>

            {file ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-950 text-amber-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                      {file.type || "Dokumen"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                  aria-label="Hapus berkas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-950 bg-slate-50/70 hover:bg-slate-50 transition-all cursor-pointer text-center">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-700 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">
                  Klik untuk memilih berkas scan surat
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format PDF, JPG, atau PNG • Maksimal {maxUploadMb} MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    setFile(picked);
                  }}
                />
              </label>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              2. Informasi Surat
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Perihal Surat *
              </label>
              <input
                type="text"
                required
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                placeholder="Contoh: Undangan Rapat Koordinasi Pengembangan Kawasan STP"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pengirim / Instansi *
                </label>
                <input
                  type="text"
                  required
                  value={pengirim}
                  onChange={(e) => setPengirim(e.target.value)}
                  placeholder="Contoh: Dinas Perindustrian Kota Surakarta"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Surat <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  placeholder="005/123/XI/2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Batas Tindak Lanjut <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="date"
                  value={batasTindakLanjut}
                  onChange={(e) => setBatasTindakLanjut(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
                />
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 cursor-pointer mt-4 sm:mt-5">
                <input
                  type="checkbox"
                  checked={isSegera}
                  onChange={(e) => setIsSegera(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <div>
                  <span className="block text-xs font-extrabold text-amber-950">
                    Tandai Sifat SEGERA
                  </span>
                  <span className="block text-[11px] text-amber-800">
                    Prioritas tinggi pada dashboard & pesan WA
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan / Instruksi Disposisi Pimpinan
              </label>
              <textarea
                rows={4}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Mohon hadiri rapat koordinasi mewakili STP dan laporkan hasilnya."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right: Multi-select Recipients & Submit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                3. Pilih Penerima Disposisi *
              </p>
              <div className="flex items-center gap-2">
                {penerimaList.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIds(
                        selectedIds.length === penerimaList.length
                          ? []
                          : penerimaList.map((p) => p.id)
                      )
                    }
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-950 underline cursor-pointer"
                  >
                    {selectedIds.length === penerimaList.length
                      ? "Hapus Semua"
                      : "Pilih Semua"}
                  </button>
                )}
                <span className="text-xs font-black bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full">
                  {selectedIds.length} dipilih
                </span>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Cari nama atau divisi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-950"
              />
            </div>

            {penerimaList.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                Belum ada penerima aktif.{" "}
                <Link
                  href="/admin/penerima"
                  className="font-bold text-slate-950 underline"
                >
                  Tambah di Master Penerima
                </Link>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredRecipients.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleRecipient(p.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        checked
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : "bg-slate-50/70 hover:bg-slate-100 text-slate-900 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">
                          {p.nama}
                        </p>
                        <p
                          className={`text-[11px] truncate ${
                            checked ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {p.jabatan}
                          {p.divisi ? ` • ${p.divisi}` : ""}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                          checked
                            ? "bg-amber-400 border-amber-400 text-slate-950"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Saat disimpan, sistem otomatis membuat <strong>1 kode arsip</strong>{" "}
                dan <strong>1 tautan khusus yang aman</strong> untuk setiap
                penerima (berlaku 30 hari).
              </p>

              <button
                type="submit"
                disabled={isPending || penerimaList.length === 0}
                className="w-full px-6 py-4 bg-slate-950 hover:bg-black disabled:opacity-60 text-white font-extrabold rounded-2xl text-sm shadow-md hover:shadow-xl flex items-center justify-center gap-2 transition-all border border-slate-800 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Menyimpan & Membuat Kode Arsip...</span>
                  </>
                ) : (
                  <>
                    <FilePlus2 className="w-4 h-4 text-amber-400" />
                    <span>Simpan Surat & Buat Disposisi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
