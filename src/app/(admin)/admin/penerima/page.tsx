import React from "react";
import { isSuperadmin, requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  PenerimaClient,
  type DivisiFilterOption,
  type PenerimaRow,
} from "./PenerimaClient";

export const metadata = {
  title: "Daftar Penerima — SIDISPO",
};

export default async function PenerimaPage() {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const [penRes, divRes] = await Promise.all([
    db
      .from("penerima")
      .select(
        "id, nama, jabatan, divisi, divisi_id, no_wa, is_active, disposisi(count), divisi_rel:divisi(nama, kode)"
      )
      .is("deleted_at", null)
      .order("is_active", { ascending: false })
      .order("nama", { ascending: true }),
    db
      .from("divisi")
      .select("id, nama, kode")
      .eq("is_active", true)
      .order("nama", { ascending: true }),
  ]);

  const items: PenerimaRow[] = (penRes.data ?? []).map((r) => {
    const countArr = r.disposisi as Array<{ count: number }> | null;
    const divRel = Array.isArray(r.divisi_rel) ? r.divisi_rel[0] : r.divisi_rel;
    return {
      id: r.id,
      nama: r.nama,
      jabatan: r.jabatan,
      divisiId: r.divisi_id ?? null,
      divisiNama: divRel?.nama || r.divisi || "-",
      divisiKode: divRel?.kode || "",
      noWa: r.no_wa,
      isActive: r.is_active,
      disposisiCount: countArr?.[0]?.count ?? 0,
    };
  });

  const divisiList: DivisiFilterOption[] = divRes.data ?? [];

  return (
    <PenerimaClient
      items={items}
      divisiList={divisiList}
      isSuperadmin={isSuperadmin(admin)}
      adminDivisiId={admin.divisiId}
    />
  );
}
