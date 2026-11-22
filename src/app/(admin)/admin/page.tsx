import React from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { SegeraBadge } from "@/components/ui/StatusBadge";
import { getReminderDaysBefore } from "@/lib/env";
import { daysUntil, formatTanggalWaktuIndo } from "@/lib/format";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildReminderMessage, buildWaMeUrl } from "@/lib/wa/provider";
import { ReminderQueueCard, type ReminderItem } from "./ReminderQueueCard";

export const metadata = {
  title: "Dashboard — SIDISPO Solo Techno Park",
};

export default async function AdminDashboardPage() {
  const db = createSupabaseAdmin();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const reminderCutoff = new Date(now);
  reminderCutoff.setDate(reminderCutoff.getDate() + getReminderDaysBefore());

  const [
    totalRes,
    todayRes,
    pendingRes,
    confirmedRes,
    recentSuratRes,
    expiringRes,
  ] = await Promise.all([
    db.from("disposisi").select("id", { count: "exact", head: true }),
    db
      .from("disposisi")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    db
      .from("disposisi")
      .select("id", { count: "exact", head: true })
      .eq("status", "BELUM_DIKONFIRMASI"),
    db
      .from("disposisi")
      .select("id", { count: "exact", head: true })
      .eq("status", "SUDAH_DIKONFIRMASI"),
    db
      .from("surat")
      .select(
        "id, kode_arsip, perihal, pengirim, is_segera, created_at, disposisi(id, status, wa_status)"
      )
      .order("created_at", { ascending: false })
      .limit(6),
    db
      .from("disposisi")
      .select(
        "id, token_expires_at, surat(id, kode_arsip, perihal), penerima(nama, jabatan, no_wa)"
      )
      .eq("status", "BELUM_DIKONFIRMASI")
      .is("revoked_at", null)
      .is("reminder_sent_at", null)
      .gt("token_expires_at", now.toISOString())
      .lte("token_expires_at", reminderCutoff.toISOString())
      .order("token_expires_at", { ascending: true })
      .limit(10),
  ]);

  const totalDisposisi = totalRes.count ?? 0;
  const disposisiHariIni = todayRes.count ?? 0;
  const belumDikonfirmasi = pendingRes.count ?? 0;
  const sudahDikonfirmasi = confirmedRes.count ?? 0;
  const recentSurat = recentSuratRes.data ?? [];

  const reminderItems: ReminderItem[] = (expiringRes.data ?? [])
    .map((d) => {
      const suratObj = Array.isArray(d.surat) ? d.surat[0] : d.surat;
      const penerimaObj = Array.isArray(d.penerima) ? d.penerima[0] : d.penerima;
      if (!suratObj || !penerimaObj) return null;

      const expDate = new Date(d.token_expires_at);
      const msg = buildReminderMessage({
        namaPenerima: penerimaObj.nama,
        kodeArsip: suratObj.kode_arsip,
        perihal: suratObj.perihal,
        expiresAt: expDate,
      });

      return {
        disposisiId: d.id,
        suratId: suratObj.id,
        kodeArsip: suratObj.kode_arsip,
        perihal: suratObj.perihal,
        namaPenerima: penerimaObj.nama,
        jabatan: penerimaObj.jabatan,
        noWa: penerimaObj.no_wa,
        expiresAt: d.token_expires_at,
        daysLeft: daysUntil(expDate),
        waMeReminderUrl: buildWaMeUrl(penerimaObj.no_wa, msg),
      };
    })
    .filter((item): item is ReminderItem => item !== null);

  return (
    <div className="space-y-8">
      <SectionHeader
        badge="Ringkasan Operasional"
        badgeIcon={<LayoutDashboard className="w-3.5 h-3.5 text-slate-700" />}
        title="Dashboard Sekretariat SIDISPO"
        description="Pantau total disposisi, konfirmasi penerimaan, dan surat yang memerlukan tindak lanjut secara terpusat."
        actions={
          <Link
            href="/admin/surat/baru"
            className="px-5 py-3 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-xs shadow-sm hover:shadow-md flex items-center gap-2 transition-all border border-slate-800 group"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Input Surat & Disposisi</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Disposisi"
          value={totalDisposisi}
          subtitle="Akumulasi seluruh distribusi penerima"
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          variant="obsidian"
          badge="Hari Ini"
          label="Disposisi Hari Ini"
          value={disposisiHariIni}
          subtitle="Tercatat sejak pukul 00.00 WIB"
          icon={<CalendarDays className="w-6 h-6" />}
        />
        <StatCard
          label="Belum Dikonfirmasi"
          value={belumDikonfirmasi}
          subtitle="Menunggu konfirmasi penerima"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          label="Sudah Dikonfirmasi"
          value={sudahDikonfirmasi}
          subtitle="Penerimaan tercatat di sistem"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
      </div>

      <ReminderQueueCard items={reminderItems} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">
            Surat & Disposisi Terbaru
          </h2>
          <Link
            href="/admin/surat"
            className="text-xs font-extrabold text-slate-700 hover:text-slate-950 flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSurat.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="Belum Ada Surat Tercatat"
            description="Mulai dengan mengunggah hasil pemindaian surat dan menetapkan penerima disposisi."
            action={
              <Link
                href="/admin/surat/baru"
                className="px-5 py-2.5 bg-slate-950 text-white font-extrabold rounded-xl text-xs"
              >
                Input Surat Pertama
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSurat.map((s) => {
              const dispList = (s.disposisi ?? []) as Array<{
                id: string;
                status: string;
                wa_status: string;
              }>;
              const total = dispList.length;
              const confirmed = dispList.filter(
                (d) => d.status === "SUDAH_DIKONFIRMASI"
              ).length;
              return (
                <Link
                  key={s.id}
                  href={`/admin/surat/${s.id}`}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between border-t-4 border-t-slate-950 hover:border-t-amber-500 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[11px] font-extrabold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        {s.kode_arsip}
                      </span>
                      {s.is_segera && <SegeraBadge />}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-950 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                      {s.perihal}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5 truncate">
                      Dari: {s.pengirim}
                    </p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400">
                      {formatTanggalWaktuIndo(s.created_at)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full ${
                        confirmed === total && total > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {confirmed}/{total} konfirmasi
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
