import React from "react";
import { requireSuperadmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DivisiClient, type DivisiItem } from "./DivisiClient";

export const metadata = {
  title: "Kelola Divisi — SIDISPO",
};

export default async function DivisiPage() {
  await requireSuperadmin();
  const db = createSupabaseAdmin();

  const [divRes, penRes, profRes] = await Promise.all([
    db
      .from("divisi")
      .select("id, nama, kode, kontak_nama, kontak_wa, is_active")
      .order("nama", { ascending: true }),
    db.from("penerima").select("divisi_id").is("deleted_at", null),
    db.from("profiles").select("divisi_id").eq("is_active", true),
  ]);

  const penCounts = new Map<string, number>();
  for (const p of penRes.data ?? []) {
    if (p.divisi_id) {
      penCounts.set(p.divisi_id, (penCounts.get(p.divisi_id) ?? 0) + 1);
    }
  }

  const adminCounts = new Map<string, number>();
  for (const pr of profRes.data ?? []) {
    if (pr.divisi_id) {
      adminCounts.set(pr.divisi_id, (adminCounts.get(pr.divisi_id) ?? 0) + 1);
    }
  }

  const items: DivisiItem[] = (divRes.data ?? []).map((d) => ({
    id: d.id,
    nama: d.nama,
    kode: d.kode,
    kontakNama: d.kontak_nama,
    kontakWa: d.kontak_wa,
    isActive: d.is_active,
    penerimaCount: penCounts.get(d.id) ?? 0,
    adminCount: adminCounts.get(d.id) ?? 0,
  }));

  return <DivisiClient items={items} />;
}
