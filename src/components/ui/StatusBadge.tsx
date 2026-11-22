import React from "react";

export function DisposisiStatusBadge({ status }: { status: string }) {
  if (status === "SUDAH_DIKONFIRMASI") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Sudah Dikonfirmasi
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Belum Dikonfirmasi
    </span>
  );
}

export function WaStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SENT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
          WA Terkirim
        </span>
      );
    case "DIKIRIM_MANUAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
          WA Manual
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
          WA Gagal
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
          Menunggu WA
        </span>
      );
  }
}

export function SegeraBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
      Segera
    </span>
  );
}

export function TokenStateBadge({
  revokedAt,
  isExpired,
}: {
  revokedAt: Date | string | null;
  isExpired: boolean;
}) {
  if (revokedAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
        Dicabut
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300 uppercase">
        Kedaluwarsa
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
      Aktif
    </span>
  );
}
