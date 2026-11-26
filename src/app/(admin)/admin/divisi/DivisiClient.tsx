"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  createDivisiAction,
  deleteDivisiAction,
  toggleDivisiActiveAction,
  updateDivisiAction,
} from "./actions";

export interface DivisiItem {
  id: string;
  nama: string;
  kode: string;
  kontakNama: string;
  kontakWa: string;
  isActive: boolean;
  penerimaCount: number;
  adminCount: number;
}

const emptyForm = {
  nama: "",
  kode: "",
  kontakNama: "",
  kontakWa: "",
  isActive: true,
};

export function DivisiClient({ items }: { items: DivisiItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DivisiItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DivisiItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (row: DivisiItem) => {
    setEditing(row);
    setForm({
      nama: row.nama,
      kode: row.kode,
      kontakNama: row.kontakNama,
      kontakWa: row.kontakWa,
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
        ? await updateDivisiAction(editing.id, form)
        : await createDivisiAction(form);
      if (!res.ok) {
        setError(res.error || "Terjadi kesalahan.");
        return;
      }
      setModalOpen(false);
    });
  };

  const handleToggle = (row: DivisiItem) => {
    setNotice(null);
    startTransition(async () => {
      const res = await toggleDivisiActiveAction(row.id, !row.isActive);
      if (!res.ok) {
        setNotice({ type: "error", text: res.error || "Gagal mengubah status." });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setNotice(null);
    startTransition(async () => {
      const res = await deleteDivisiAction(deleteTarget.id);
      setDeleteTarget(null);
      if (!res.ok) {
        setNotice({ type: "error", text: res.error || "Gagal menghapus divisi." });
        return;
      }
      setNotice({ type: "ok", text: "Divisi berhasil dihapus." });
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Pengaturan Superadmin"
        badgeIcon={<Building2 className="w-3.5 h-3.5 text-slate-700" />}
        title="Kelola Divisi & Kontak Person"
        description="Atur daftar divisi, kode singkat arsip (contoh: INK, DIK, KEU), dan kontak person WhatsApp yang tampil di halaman penerima."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="px-5 py-3 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-xs shadow-xs hover:shadow-md flex items-center gap-2 transition-all border border-slate-800 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Tambah Divisi</span>
          </button>
        }
      />

      {notice && (
        <div
          role="status"
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            notice.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notice.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="Belum Ada Divisi"
          description="Tambahkan divisi terlebih dahulu sebelum membuat akun admin divisi atau daftar penerima."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="px-5 py-2.5 bg-slate-950 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Tambah Divisi Pertama
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between gap-4 border-t-4 border-t-slate-950"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black bg-slate-950 text-amber-400 px-3 py-1 rounded-xl">
                    {d.kode}
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggle(d)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border cursor-pointer ${
                      d.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {d.isActive ? (
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
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-950">
                    {d.nama}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Format arsip: STP/{d.kode}/2026/0001
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Kontak Person Divisi
                  </p>
                  <p className="font-extrabold text-slate-900">
                    {d.kontakNama || "-"}
                  </p>
                  <p className="font-mono text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {d.kontakWa ? `+${d.kontakWa}` : "-"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">
                  {d.adminCount} admin • {d.penerimaCount} penerima
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(d)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-950 text-slate-800 hover:text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(d)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white transition-all cursor-pointer"
                    title="Hapus divisi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Data Divisi" : "Tambah Divisi Baru"}
        subtitle="Solo Techno Park • Kelola Divisi"
        icon={<Building2 className="w-5 h-5" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Divisi *
              </label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Inkubasi & Akselerasi"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode Arsip *
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={form.kode}
                onChange={(e) =>
                  setForm({ ...form, kode: e.target.value.toUpperCase() })
                }
                placeholder="INK"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-bold uppercase text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Kontak Person *
              </label>
              <input
                type="text"
                required
                value={form.kontakNama}
                onChange={(e) =>
                  setForm({ ...form, kontakNama: e.target.value })
                }
                placeholder="Contoh: Mbak Rina (Admin Inkubasi)"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Kontak Person *
              </label>
              <input
                type="tel"
                required
                value={form.kontakWa}
                onChange={(e) => setForm({ ...form, kontakWa: e.target.value })}
                placeholder="081234567890"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Kontak person ini akan ditampilkan di halaman penerima ketika divisi
            ini mengirim surat, agar penerima tahu siapa yang harus dihubungi.
          </p>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-slate-950"
            />
            <span className="text-xs font-bold text-slate-700">
              Divisi aktif
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
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editing ? "Simpan Perubahan" : "Simpan Divisi"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Divisi Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Divisi?"
        subtitle={deleteTarget ? `${deleteTarget.nama} (${deleteTarget.kode})` : ""}
        icon={<Trash2 className="w-5 h-5" />}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Yakin ingin menghapus divisi{" "}
            <strong className="text-slate-950">{deleteTarget?.nama}</strong>?
            Divisi hanya dapat dihapus jika belum memiliki surat, admin, atau
            penerima aktif.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
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
              <span>Ya, Hapus Divisi</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
