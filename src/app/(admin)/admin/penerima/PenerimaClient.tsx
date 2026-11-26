"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  createPenerimaAction,
  updatePenerimaAction,
  togglePenerimaActiveAction,
  deletePenerimaAction,
} from "./actions";

export interface PenerimaRow {
  id: string;
  nama: string;
  jabatan: string;
  divisiId: string | null;
  divisiNama: string;
  divisiKode: string;
  noWa: string;
  isActive: boolean;
  disposisiCount: number;
}

export interface DivisiFilterOption {
  id: string;
  nama: string;
  kode: string;
}

export function PenerimaClient({
  items,
  divisiList,
  isSuperadmin,
  adminDivisiId,
}: {
  items: PenerimaRow[];
  divisiList: DivisiFilterOption[];
  isSuperadmin: boolean;
  adminDivisiId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filterDivisiId, setFilterDivisiId] = useState<string>(
    !isSuperadmin && adminDivisiId ? adminDivisiId : "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PenerimaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PenerimaRow | null>(null);
  const [form, setForm] = useState({
    nama: "",
    jabatan: "",
    divisiId: adminDivisiId || divisiList[0]?.id || "",
    noWa: "",
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const countByDivisi = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.divisiId) {
        map.set(item.divisiId, (map.get(item.divisiId) ?? 0) + 1);
      }
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterDivisiId !== "all" && item.divisiId !== filterDivisiId) {
        return false;
      }
      if (filterStatus === "active" && !item.isActive) return false;
      if (filterStatus === "inactive" && item.isActive) return false;
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.jabatan.toLowerCase().includes(q) ||
        item.divisiNama.toLowerCase().includes(q) ||
        item.noWa.includes(q)
      );
    });
  }, [items, search, filterStatus, filterDivisiId]);

  const canManageRow = (row: PenerimaRow) =>
    isSuperadmin || (Boolean(adminDivisiId) && row.divisiId === adminDivisiId);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nama: "",
      jabatan: "",
      divisiId:
        !isSuperadmin && adminDivisiId
          ? adminDivisiId
          : filterDivisiId !== "all"
            ? filterDivisiId
            : divisiList[0]?.id || "",
      noWa: "",
      isActive: true,
    });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (row: PenerimaRow) => {
    setEditing(row);
    setForm({
      nama: row.nama,
      jabatan: row.jabatan,
      divisiId: row.divisiId || adminDivisiId || divisiList[0]?.id || "",
      noWa: row.noWa,
      isActive: row.isActive,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = editing
        ? await updatePenerimaAction(editing.id, form)
        : await createPenerimaAction(form);
      if (!res.ok) {
        setError(res.error || "Terjadi kesalahan.");
        return;
      }
      setModalOpen(false);
    });
  };

  const handleToggle = (row: PenerimaRow) => {
    startTransition(async () => {
      await togglePenerimaActiveAction(row.id, !row.isActive);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deletePenerimaAction(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  const canAdd = isSuperadmin || Boolean(adminDivisiId);

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Data Penerima"
        badgeIcon={<Users className="w-3.5 h-3.5 text-slate-700" />}
        title="Daftar Penerima & Kontak Person"
        description={
          isSuperadmin
            ? "Kelola daftar penerima surat di seluruh divisi beserta nomor WhatsApp aktifnya."
            : "Lihat direktori kontak semua divisi. Anda dapat menambah atau mengubah penerima di divisi Anda sendiri."
        }
        actions={
          canAdd ? (
            <button
              type="button"
              onClick={openCreate}
              className="px-5 py-3 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-xs shadow-xs hover:shadow-md flex items-center gap-2 transition-all border border-slate-800 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Tambah Penerima</span>
            </button>
          ) : undefined
        }
      />

      {/* Control Bar with Division Dropdown */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {(
                [
                  { id: "all", label: "Semua" },
                  { id: "active", label: "Aktif" },
                  { id: "inactive", label: "Nonaktif" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    filterStatus === tab.id
                      ? "bg-slate-950 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filter Divisi */}
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <select
                value={filterDivisiId}
                onChange={(e) => setFilterDivisiId(e.target.value)}
                aria-label="Filter berdasarkan divisi"
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-950 cursor-pointer"
              >
                <option value="all">Semua Divisi ({items.length})</option>
                {divisiList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({countByDivisi.get(d.id) ?? 0})
                    {!isSuperadmin && d.id === adminDivisiId
                      ? " — Divisi Saya"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, jabatan, divisi, atau nomor WA..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="Belum Ada Data Penerima"
          description="Tidak ada penerima yang cocok dengan filter divisi atau kata kunci pencarian saat ini."
          action={
            canAdd ? (
              <button
                type="button"
                onClick={openCreate}
                className="px-5 py-2.5 bg-slate-950 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Tambah Penerima
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[740px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-6">Nama & Jabatan</th>
                  <th className="py-4 px-6">Divisi</th>
                  <th className="py-4 px-6">Nomor WhatsApp</th>
                  <th className="py-4 px-6">Total Surat</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const editable = canManageRow(row);
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-slate-950 text-sm">
                          {row.nama}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {row.jabatan}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span>{row.divisiNama || "-"}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Phone className="w-3 h-3 text-slate-500" />
                          +{row.noWa}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {row.disposisiCount} surat
                      </td>
                      <td className="py-4 px-6">
                        {editable ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggle(row)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer ${
                              row.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {row.isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Aktif
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Nonaktif
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                              row.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {row.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {editable ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-950 text-slate-700 hover:text-white transition-all cursor-pointer"
                              title="Ubah penerima"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer"
                              title="Hapus penerima"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Divisi lain
                          </span>
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

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Data Penerima" : "Tambah Penerima Baru"}
        subtitle="Solo Techno Park • Daftar Penerima"
        icon={<Users className="w-5 h-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.T."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Jabatan *
              </label>
              <input
                type="text"
                required
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                placeholder="Kepala Divisi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Divisi *
              </label>
              <select
                required
                disabled={!isSuperadmin}
                value={form.divisiId}
                onChange={(e) => setForm({ ...form, divisiId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950 disabled:opacity-70"
              >
                <option value="">-- Pilih Divisi --</option>
                {divisiList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} ({d.kode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp *
            </label>
            <input
              type="tel"
              required
              value={form.noWa}
              onChange={(e) => setForm({ ...form, noWa: e.target.value })}
              placeholder="081234567890"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Boleh ditulis mulai dari 08... atau 62..., sistem akan merapikan
              otomatis.
            </p>
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 accent-slate-950"
            />
            <span className="text-xs font-bold text-slate-700">
              Penerima aktif (muncul di pilihan surat baru)
            </span>
          </label>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editing ? "Simpan Perubahan" : "Simpan Penerima"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Penerima?"
        subtitle="Catatan Surat Sebelumnya Tetap Aman"
        icon={<Trash2 className="w-5 h-5" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Penerima{" "}
            <span className="font-extrabold text-slate-950">
              {deleteTarget?.nama}
            </span>{" "}
            akan disembunyikan dari daftar pilihan surat baru. Catatan surat yang
            pernah dikirim sebelumnya tetap tersimpan.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Ya, Hapus</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
