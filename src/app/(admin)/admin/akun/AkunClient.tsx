"use client";

import React, { useState, useTransition } from "react";
import {
  UserCog,
  Plus,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { AdminRole } from "@/lib/types";
import {
  createAdminAccountAction,
  updateAdminAccountAction,
} from "./actions";

export interface AkunItem {
  id: string;
  nama: string;
  email: string;
  role: AdminRole;
  divisiId: string | null;
  divisiNama: string | null;
  divisiKode: string | null;
  isActive: boolean;
}

export interface DivisiSimpleOption {
  id: string;
  nama: string;
  kode: string;
}

export function AkunClient({
  items,
  divisiList,
  currentAdminId,
}: {
  items: AkunItem[];
  divisiList: DivisiSimpleOption[];
  currentAdminId: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AkunItem | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [createForm, setCreateForm] = useState({
    nama: "",
    email: "",
    role: "ADMIN_DIVISI" as AdminRole,
    divisiId: divisiList[0]?.id || "",
    mode: "password" as "invite" | "password",
    password: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    nama: "",
    role: "ADMIN_DIVISI" as AdminRole,
    divisiId: "",
    isActive: true,
  });

  const openCreate = () => {
    setError(null);
    setCreateForm({
      nama: "",
      email: "",
      role: "ADMIN_DIVISI",
      divisiId: divisiList[0]?.id || "",
      mode: "password",
      password: "",
    });
    setShowPwd(false);
    setCreateOpen(true);
  };

  const openEdit = (row: AkunItem) => {
    setError(null);
    setEditing(row);
    setEditForm({
      id: row.id,
      nama: row.nama,
      role: row.role,
      divisiId: row.divisiId || divisiList[0]?.id || "",
      isActive: row.isActive,
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await createAdminAccountAction(createForm);
      if (!res.ok) {
        setError(res.error || "Gagal membuat akun.");
        return;
      }
      setNotice(res.message || "Akun admin berhasil dibuat.");
      setCreateOpen(false);
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await updateAdminAccountAction(editForm);
      if (!res.ok) {
        setError(res.error || "Gagal memperbarui akun.");
        return;
      }
      setNotice("Perubahan akun admin berhasil disimpan.");
      setEditing(null);
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Pengaturan Superadmin"
        badgeIcon={<UserCog className="w-3.5 h-3.5 text-slate-700" />}
        title="Kelola Akun Admin"
        description="Buat akun untuk admin tiap divisi, atur penempatan divisi, atau nonaktifkan akun jika pegawai pindah/keluar."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="px-5 py-3 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-xs shadow-xs hover:shadow-md flex items-center gap-2 transition-all border border-slate-800 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Buat Akun Admin</span>
          </button>
        }
      />

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<UserCog className="w-6 h-6" />}
          title="Belum Ada Akun Admin"
          description="Buat akun admin untuk setiap divisi agar masing-masing divisi dapat mencatat dan mengirim surat."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[720px]">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-6">Nama & Email</th>
                  <th className="py-4 px-6">Peran</th>
                  <th className="py-4 px-6">Divisi</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/90">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-950 text-sm">
                          {row.nama}
                        </p>
                        {row.id === currentAdminId && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      {row.role === "SUPERADMIN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          Superadmin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                          Admin Divisi
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {row.role === "SUPERADMIN" ? (
                        <span className="text-slate-400 font-medium">
                          Semua Divisi
                        </span>
                      ) : row.divisiNama ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.divisiNama}</span>
                          {row.divisiKode && (
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                              {row.divisiKode}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-rose-600">Belum dipilih</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {row.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-950 text-slate-800 hover:text-white font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Atur</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Akun Admin Baru"
        subtitle="Solo Techno Park • Kelola Akun"
        icon={<UserCog className="w-5 h-5" />}
      >
        <form onSubmit={handleCreate} className="space-y-4">
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
              value={createForm.nama}
              onChange={(e) =>
                setCreateForm({ ...createForm, nama: e.target.value })
              }
              placeholder="Contoh: Rina Kartika"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Login *
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="admin.inkubasi@solotechnopark.id"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Peran *
              </label>
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    role: e.target.value as AdminRole,
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
              >
                <option value="ADMIN_DIVISI">Admin Divisi</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </div>

            {createForm.role === "ADMIN_DIVISI" && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Divisi *
                </label>
                <select
                  required
                  value={createForm.divisiId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, divisiId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
                >
                  <option value="">-- Pilih Divisi --</option>
                  {divisiList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama} ({d.kode})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Cara Pembuatan Akses
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setCreateForm({ ...createForm, mode: "password" })
                }
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  createForm.mode === "password"
                    ? "bg-slate-950 text-white border-slate-950"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                Buat Password Awal
              </button>
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, mode: "invite" })}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  createForm.mode === "invite"
                    ? "bg-slate-950 text-white border-slate-950"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                Kirim Undangan Email
              </button>
            </div>
          </div>

          {createForm.mode === "password" ? (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Password Awal (minimal 8 karakter) *
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="Masukkan password awal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-11 py-3 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-950"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-800 cursor-pointer"
                  aria-label="Lihat password"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sampaikan password awal secara langsung (bukan di grup umum).
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              Sistem akan mengirim email undangan ke alamat di atas agar admin
              dapat menentukan password-nya sendiri.
            </p>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
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
              <span>Simpan Akun</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Atur Akun Admin"
        subtitle={editing?.email || ""}
        icon={<UserCog className="w-5 h-5" />}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
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
              value={editForm.nama}
              onChange={(e) =>
                setEditForm({ ...editForm, nama: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Peran
              </label>
              <select
                value={editForm.role}
                disabled={editForm.id === currentAdminId}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    role: e.target.value as AdminRole,
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                <option value="ADMIN_DIVISI">Admin Divisi</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </div>

            {editForm.role === "ADMIN_DIVISI" && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Divisi
                </label>
                <select
                  required
                  value={editForm.divisiId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, divisiId: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900"
                >
                  <option value="">-- Pilih Divisi --</option>
                  {divisiList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama} ({d.kode})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {editForm.id !== currentAdminId && (
            <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm({ ...editForm, isActive: e.target.checked })
                }
                className="w-4 h-4 accent-slate-950"
              />
              <div>
                <span className="block text-xs font-extrabold text-slate-900">
                  Akun Aktif
                </span>
                <span className="block text-[11px] text-slate-500">
                  Jika dimatikan, sesi login akun ini langsung diputus.
                </span>
              </div>
            </label>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
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
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
