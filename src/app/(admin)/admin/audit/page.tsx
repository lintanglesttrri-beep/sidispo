import React from "react";
import Link from "next/link";
import { History, Clock, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatAuditSummary, getAuditEventLabel } from "@/lib/audit-format";
import { isSuperadmin, requireAdmin } from "@/lib/auth";
import { formatTanggalWaktuIndo } from "@/lib/format";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const metadata = {
  title: "Riwayat Aktivitas — SIDISPO",
};

const FILTER_OPTIONS = [
  { key: "", label: "Semua Aktivitas" },
  { key: "SURAT_CREATED", label: "Surat Dicatat" },
  { key: "WA_MANUAL_MARKED_SENT", label: "WA Dikirim" },
  { key: "LINK_OPENED", label: "Tautan Dibuka" },
  { key: "CONFIRMED", label: "Dikonfirmasi" },
  { key: "TOKEN_EXTENDED", label: "Diperpanjang" },
  { key: "TOKEN_REISSUED", label: "Tautan Baru" },
  { key: "TOKEN_REVOKED", label: "Dinonaktifkan" },
  { key: "REMINDER_SENT", label: "Pengingat" },
  { key: "ADMIN_LOGIN", label: "Admin Masuk" },
];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; divisi?: string }>;
}) {
  const admin = await requireAdmin();
  const isSuper = isSuperadmin(admin);
  const sp = await searchParams;
  const eventFilter = sp.event || "";
  const divisiFilter = isSuper ? sp.divisi || "" : admin.divisiId || "";

  const db = createSupabaseAdmin();

  const divisiRes = isSuper
    ? await db
        .from("divisi")
        .select("id, nama, kode")
        .order("nama", { ascending: true })
    : { data: [] };

  let query = db
    .from("audit_logs")
    .select(
      "id, event_type, actor_email, event_data, created_at, surat(id, kode_arsip), divisi(nama, kode)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (eventFilter) {
    query = query.eq("event_type", eventFilter);
  }
  if (divisiFilter) {
    query = query.eq("divisi_id", divisiFilter);
  } else if (!isSuper) {
    query = query.eq("actor_id", admin.id);
  }

  const { data: logs } = await query;

  const buildUrl = (overrides: { event?: string; divisi?: string }) => {
    const params = new URLSearchParams();
    const ev = overrides.event !== undefined ? overrides.event : eventFilter;
    const div =
      overrides.divisi !== undefined
        ? overrides.divisi
        : isSuper
          ? divisiFilter
          : "";
    if (ev) params.set("event", ev);
    if (div) params.set("divisi", div);
    const qs = params.toString();
    return qs ? `/admin/audit?${qs}` : "/admin/audit";
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        badge={
          isSuper
            ? "Catatan Riwayat • Semua Divisi"
            : `Catatan Riwayat • Divisi ${admin.divisiNama || "-"}`
        }
        badgeIcon={<History className="w-3.5 h-3.5 text-slate-700" />}
        title="Riwayat Aktivitas Sistem"
        description="Rekaman seluruh aktivitas surat, pengiriman WhatsApp, pembukaan tautan, dan konfirmasi penerimaan yang tercatat otomatis."
      />

      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {FILTER_OPTIONS.map((opt) => (
            <Link
              key={opt.key || "ALL"}
              href={buildUrl({ event: opt.key })}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                eventFilter === opt.key
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {isSuper && (divisiRes.data?.length ?? 0) > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-400 uppercase pr-1">
              <Building2 className="w-3.5 h-3.5" /> Divisi:
            </span>
            <Link
              href={buildUrl({ divisi: "" })}
              className={`px-3 py-1.5 rounded-xl ${
                !divisiFilter
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Semua
            </Link>
            {(divisiRes.data ?? []).map((d) => (
              <Link
                key={d.id}
                href={buildUrl({ divisi: d.id })}
                className={`px-3 py-1.5 rounded-xl ${
                  divisiFilter === d.id
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {d.nama}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!logs || logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6" />}
          title="Belum Ada Catatan Aktivitas"
          description="Seluruh aktivitas surat dan penerimaan akan tercatat otomatis di sini."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-6">Waktu</th>
                  <th className="py-4 px-6">Aktivitas</th>
                  <th className="py-4 px-6">Divisi</th>
                  <th className="py-4 px-6">Oleh</th>
                  <th className="py-4 px-6">Kode Arsip</th>
                  <th className="py-4 px-6">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => {
                  const suratObj = Array.isArray(l.surat)
                    ? l.surat[0]
                    : l.surat;
                  const divObj = Array.isArray(l.divisi)
                    ? l.divisi[0]
                    : l.divisi;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/90">
                      <td className="py-3.5 px-6 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTanggalWaktuIndo(l.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="text-xs font-extrabold bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg">
                          {getAuditEventLabel(l.event_type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-700">
                        {divObj?.nama || "-"}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-700">
                        {l.actor_email || "Penerima"}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        {suratObj ? (
                          <Link
                            href={`/admin/surat/${suratObj.id}`}
                            className="font-mono font-extrabold text-slate-950 hover:text-amber-600 underline"
                          >
                            {suratObj.kode_arsip}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-600 max-w-md truncate">
                        {formatAuditSummary(
                          l.event_type,
                          l.event_data as Record<string, unknown> | null
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
