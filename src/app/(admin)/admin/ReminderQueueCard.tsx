"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, ExternalLink, Send, Loader2 } from "lucide-react";
import { markReminderSentAction } from "@/app/(admin)/admin/surat/actions";
import { formatTanggalIndo } from "@/lib/format";

export interface ReminderItem {
  disposisiId: string;
  suratId: string;
  kodeArsip: string;
  perihal: string;
  namaPenerima: string;
  jabatan: string;
  noWa: string;
  expiresAt: string;
  daysLeft: number;
  waMeReminderUrl: string;
}

export function ReminderQueueCard({ items }: { items: ReminderItem[] }) {
  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const handleMarkReminded = (disposisiId: string) => {
    startTransition(async () => {
      const res = await markReminderSentAction(disposisiId);
      if (res.ok) {
        setDoneIds((prev) => ({ ...prev, [disposisiId]: true }));
      }
    });
  };

  const visible = items.filter((i) => !doneIds[i.disposisiId]);

  return (
    <div className="bg-white rounded-3xl border border-amber-200/90 shadow-2xs p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950">
              Perlu Diingatkan ({visible.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Penerima belum konfirmasi dan tautan surat akan habis dalam 3 hari lagi.
            </p>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tidak ada disposisi yang mendekati masa kedaluwarsa saat ini.</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((item) => (
            <div
              key={item.disposisiId}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/surat/${item.suratId}`}
                    className="font-mono text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md hover:bg-slate-200"
                  >
                    {item.kodeArsip}
                  </Link>
                  <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Sisa {Math.max(0, item.daysLeft)} hari (s.d.{" "}
                    {formatTanggalIndo(item.expiresAt)})
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-950 truncate mt-1">
                  {item.namaPenerima}{" "}
                  <span className="text-xs font-medium text-slate-500">
                    — {item.jabatan}
                  </span>
                </p>
                <p className="text-xs text-slate-600 truncate">{item.perihal}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={item.waMeReminderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ingatkan via WA</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleMarkReminded(item.disposisiId)}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Tandai</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
