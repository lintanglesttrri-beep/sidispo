import React from "react";
import { isSuperadmin, requireAdmin } from "@/lib/auth";
import { getMaxUploadMb } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  SuratBaruForm,
  type DivisiChoice,
  type PenerimaOption,
} from "./SuratBaruForm";

export const metadata = {
  title: "Catat Surat & Disposisi — SIDISPO",
};

export default async function SuratBaruPage() {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const [penRes, divRes] = await Promise.all([
    db
      .from("penerima")
      .select(
        "id, nama, jabatan, divisi, divisi_id, no_wa, divisi_rel:divisi(nama, kode)"
      )
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("nama", { ascending: true }),
    db
      .from("divisi")
      .select("id, nama, kode")
      .eq("is_active", true)
      .order("nama", { ascending: true }),
  ]);

  const recipients: PenerimaOption[] = (penRes.data ?? []).map((r) => {
    const divRel = Array.isArray(r.divisi_rel) ? r.divisi_rel[0] : r.divisi_rel;
    return {
      id: r.id,
      nama: r.nama,
      jabatan: r.jabatan,
      divisiId: r.divisi_id ?? null,
      divisiNama: divRel?.nama || r.divisi || "-",
      divisiKode: divRel?.kode || "",
      noWa: r.no_wa,
    };
  });

  const divisiList: DivisiChoice[] = divRes.data ?? [];

  return (
    <SuratBaruForm
      penerimaList={recipients}
      divisiList={divisiList}
      isSuperadmin={isSuperadmin(admin)}
      adminDivisiId={admin.divisiId}
      adminDivisiNama={admin.divisiNama}
      maxUploadMb={getMaxUploadMb()}
    />
  );
}
