import React from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SegeraBadge, WaStatusBadge } from "@/components/ui/StatusBadge";
import { isSuperadmin, requireAdmin } from "@/lib/auth";
import { formatTanggalWaktuIndo } from "@/lib/format";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const metadata = {
  title: "Daftar Surat — SIDISPO",
};

const PAGE_SIZE = 12;

export default async function MonitoringSuratPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    box?: string;
    divisi?: string;
    status?: string;
    segera?: string;
    page?: string;
  }>;
}) {
  const admin = await requireAdmin();
  const isSuper = isSuperadmin(admin);

  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const box = !isSuper && sp.box === "masuk" ? "masuk" : "keluar";
  const divisiFilter = isSuper ? sp.divisi || "" : "";
  const statusFilter = sp.status || "all";
  const segeraOnly = sp.segera === "1";
  const currentPage = Math.max(1, Number.parseInt(sp.page || "1", 10) || 1);

  const db = createSupabaseAdmin();

  const divisiRes = isSuper
    ? await db
        .from("divisi")
        .select("id, nama, kode")
        .eq("is_active", true)
        .order("nama", { ascending: true })
    : { data: [] };

  let query = db
    .from("surat")
    .select(
      "id, divisi_id, kode_arsip, perihal, pengirim, nomor_surat, is_segera, created_at, divisi(nama, kode), disposisi(id, status, wa_status, penerima(nama, divisi_id))"
    )
    .order("created_at", { ascending: false });

  if (isSuper) {
    if (divisiFilter) {
      query = query.eq("divisi_id", divisiFilter);
    }
  } else if (box === "keluar") {
    if (admin.divisiId) {
      query = query.eq("divisi_id", admin.divisiId);
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  } else if (admin.divisiId) {
    // Surat Masuk: created by OTHER divisions, directed to recipients in admin's division
    query = query.neq("divisi_id", admin.divisiId);
  }

  if (q) {
    const safeQ = q.replace(/[%_,()]/g, "");
    if (safeQ) {
      query = query.or(
        `kode_arsip.ilike.%${safeQ}%,perihal.ilike.%${safeQ}%,pengirim.ilike.%${safeQ}%,nomor_surat.ilike.%${safeQ}%`
      );
    }
  }

  if (segeraOnly) {
    query = query.eq("is_segera", true);
  }

  const { data: rawRows } = await query.limit(500);

  const allItems = (rawRows ?? []).filter((surat) => {
    const disps = (surat.disposisi ?? []) as Array<{
      status: string;
      penerima:
        | { nama: string; divisi_id: string | null }
        | Array<{ nama: string; divisi_id: string | null }>
        | null;
    }>;

    // For Surat Masuk, keep only letters that actually have a recipient in admin's division
    if (!isSuper && box === "masuk") {
      if (!admin.divisiId) return false;
      const targetsMyDiv = disps.some((d) => {
        const p = Array.isArray(d.penerima) ? d.penerima[0] : d.penerima;
        return p?.divisi_id === admin.divisiId;
      });
      if (!targetsMyDiv) return false;
    }

    if (statusFilter === "pending") {
      return disps.some((d) => d.status === "BELUM_DIKONFIRMASI");
    }
    if (statusFilter === "confirmed") {
      return (
        disps.length > 0 &&
        disps.every((d) => d.status === "SUDAH_DIKONFIRMASI")
      );
    }
    return true;
  });

  const totalCount = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const items = allItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      q: q || undefined,
      box: !isSuper && box === "masuk" ? "masuk" : undefined,
      divisi: isSuper && divisiFilter ? divisiFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      segera: segeraOnly ? "1" : undefined,
      page: undefined,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return qs ? `/admin/surat?${qs}` : "/admin/surat";
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Monitoring & Arsip Surat"
        badgeIcon={<Mail className="w-3.5 h-3.5 text-slate-700" />}
        title="Daftar Surat & Disposisi"
        description={
          isSuper
            ? "Pantau seluruh surat dari semua divisi, cari berdasarkan kode arsip atau perihal, dan cek status konfirmasi."
            : "Kelola Surat Keluar dari divisi Anda dan pantau Surat Masuk dari divisi lain yang ditujukan ke anggota divisi Anda."
        }
        actions={
          <Link
            href="/admin/surat/baru"
            className="px-5 py-3 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-xs shadow-xs hover:shadow-md flex items-center gap-2 transition-all border border-slate-800"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Catat Surat Baru</span>
          </Link>
        }
      />

      {/* Surat Keluar / Surat Masuk Tabs for Admin Divisi */}
      {!isSuper && (
        <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs gap-1.5">
          <Link
            href={buildUrl({ box: undefined, page: "1" })}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              box === "keluar"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            <span>Surat Keluar ({admin.divisiNama || "Divisi Saya"})</span>
          </Link>
          <Link
            href={buildUrl({ box: "masuk", page: "1" })}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              box === "masuk"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>Surat Masuk (Dari Divisi Lain)</span>
          </Link>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {[
              { id: "all", label: "Semua Status" },
              { id: "pending", label: "Belum Lengkap Konfirmasi" },
              { id: "confirmed", label: "Semua Dikonfirmasi" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={buildUrl({
                  status: tab.id === "all" ? undefined : tab.id,
                  page: "1",
                })}
                className={`px-4 py-2 rounded-xl transition-all ${
                  statusFilter === tab.id
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </Link>
            ))}

            <Link
              href={buildUrl({
                segera: segeraOnly ? undefined : "1",
                page: "1",
              })}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                segeraOnly
                  ? "bg-amber-500 text-slate-950 font-extrabold shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hanya Segera</span>
            </Link>
          </div>
        </div>

        <form action="/admin/surat" method="get" className="flex flex-wrap gap-2">
          {!isSuper && box === "masuk" && (
            <input type="hidden" name="box" value="masuk" />
          )}
          {statusFilter !== "all" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          {segeraOnly && <input type="hidden" name="segera" value="1" />}

          {isSuper && (
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <select
                name="divisi"
                defaultValue={divisiFilter}
                className="bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-6 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-950"
              >
                <option value="">Semua Divisi Pencatat</option>
                {(divisiRes.data ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.kode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari kode arsip, perihal, pengirim, atau nomor surat..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Mail className="w-6 h-6" />}
          title="Belum Ada Surat"
          description={
            !isSuper && box === "masuk"
              ? "Belum ada surat dari divisi lain yang ditujukan ke anggota divisi Anda."
              : "Tidak ada surat yang cocok dengan filter atau kata kunci pencarian saat ini."
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[840px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-6">Kode Arsip & Divisi</th>
                  <th className="py-4 px-6">Perihal & Pengirim</th>
                  <th className="py-4 px-6">Penerima</th>
                  <th className="py-4 px-6">Status WA</th>
                  <th className="py-4 px-6">Konfirmasi</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((surat) => {
                  const divObj = Array.isArray(surat.divisi)
                    ? surat.divisi[0]
                    : surat.divisi;
                  const disps = (surat.disposisi ?? []) as Array<{
                    id: string;
                    status: string;
                    wa_status: string;
                    penerima: { nama: string } | Array<{ nama: string }> | null;
                  }>;
                  const total = disps.length;
                  const confirmed = disps.filter(
                    (d) => d.status === "SUDAH_DIKONFIRMASI"
                  ).length;
                  const hasFailed = disps.some((d) => d.wa_status === "FAILED");
                  const hasPending = disps.some((d) => d.wa_status === "PENDING");
                  const hasManual = disps.some(
                    (d) => d.wa_status === "DIKIRIM_MANUAL"
                  );
                  const summaryWa = hasFailed
                    ? "FAILED"
                    : hasPending
                      ? "PENDING"
                      : hasManual
                        ? "DIKIRIM_MANUAL"
                        : "SENT";

                  const recipientNames = disps
                    .map((d) => {
                      const p = Array.isArray(d.penerima)
                        ? d.penerima[0]
                        : d.penerima;
                      return p?.nama || "";
                    })
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={surat.id}
                      className="hover:bg-slate-50/90 transition-colors group"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-950">
                            {surat.kode_arsip}
                          </span>
                          {surat.is_segera && <SegeraBadge />}
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {divObj?.nama || "-"} •{" "}
                          <span className="text-slate-400 font-normal">
                            {formatTanggalWaktuIndo(surat.created_at)}
                          </span>
                        </p>
                      </td>

                      <td className="py-4 px-6 max-w-xs">
                        <p className="font-extrabold text-slate-950 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                          {surat.perihal}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {surat.pengirim}
                          {surat.nomor_surat ? ` • No. ${surat.nomor_surat}` : ""}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">
                          {total} penerima
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {recipientNames}
                        </p>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <WaStatusBadge status={summaryWa} />
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            confirmed === total && total > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {confirmed}/{total} selesai
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <Link
                          href={`/admin/surat/${surat.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 group-hover:bg-slate-950 text-slate-800 group-hover:text-white font-bold rounded-xl text-xs transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-600">
          <span>
            Menampilkan {(currentPage - 1) * PAGE_SIZE + 1} –{" "}
            {Math.min(currentPage * PAGE_SIZE, totalCount)} dari {totalCount}{" "}
            surat
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={buildUrl({ page: String(Math.max(1, currentPage - 1)) })}
              aria-disabled={currentPage === 1}
              className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 ${
                currentPage === 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Link
              href={buildUrl({
                page: String(Math.min(totalPages, currentPage + 1)),
              })}
              aria-disabled={currentPage === totalPages}
              className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 ${
                currentPage === totalPages
                  ? "pointer-events-none opacity-40"
                  : ""
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
