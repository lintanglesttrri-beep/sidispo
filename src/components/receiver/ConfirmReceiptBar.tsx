"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatTanggalWaktuIndo } from "@/lib/format";
import { confirmReceiptAction } from "@/app/d/[token]/actions";

interface ConfirmBarProps {
  rawToken: string;
  initialConfirmedAt: string | null;
}

export function ConfirmReceiptBar({
  rawToken,
  initialConfirmedAt,
}: ConfirmBarProps) {
  const [confirmedAt, setConfirmedAt] = useState<string | null>(
    initialConfirmedAt
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await confirmReceiptAction(rawToken);
      if (!res.ok) {
        setError(res.error || "Gagal mencatat konfirmasi.");
        return;
      }
      setConfirmedAt(res.confirmedAt || new Date().toISOString());
      setModalOpen(false);
    });
  };

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3.5 shadow-[0_-8px_24px_rgba(2,6,23,0.06)]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {confirmedAt ? (
            <div className="w-full flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-emerald-900">
                    Penerimaan Sudah Dikonfirmasi
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Tercatat pada {formatTanggalWaktuIndo(confirmedAt)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2.5 py-1 rounded-full shrink-0">
                Selesai
              </span>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-600">
                <p className="font-extrabold text-slate-900">
                  Sudah menerima salinan surat ini?
                </p>
                <p className="text-[11px] text-slate-500">
                  Tekan tombol konfirmasi untuk mencatat waktu penerimaan di Sekretariat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition-all border border-slate-800 shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Konfirmasi Penerimaan</span>
              </button>
            </>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Konfirmasi Penerimaan Surat"
        subtitle="Solo Techno Park • SIDISPO"
        icon={<ShieldCheck className="w-5 h-5" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed">
            Dengan menekan <strong>Ya, Konfirmasi Penerimaan</strong>, sistem
            akan mencatat bahwa Anda telah menerima salinan digital surat dan
            instruksi disposisi ini.
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            Catatan: Konfirmasi ini merupakan bukti penerimaan operasional di
            dalam SIDISPO (bukan tanda tangan elektronik tersertifikasi). Waktu
            konfirmasi hanya dicatat satu kali dan tidak dapat diubah.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              )}
              <span>Ya, Konfirmasi Penerimaan</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
