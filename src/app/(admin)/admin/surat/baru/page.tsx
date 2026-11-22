import React from "react";
import { getMaxUploadMb } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { SuratBaruForm } from "./SuratBaruForm";

export const metadata = {
  title: "Input Surat & Disposisi — SIDISPO",
};

export default async function SuratBaruPage() {
  const db = createSupabaseAdmin();
  const { data: rows } = await db
    .from("penerima")
    .select("id, nama, jabatan, divisi, no_wa")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("nama", { ascending: true });

  const recipients = (rows ?? []).map((r) => ({
    id: r.id,
    nama: r.nama,
    jabatan: r.jabatan,
    divisi: r.divisi,
    noWa: r.no_wa,
  }));

  return (
    <SuratBaruForm
      penerimaList={recipients}
      maxUploadMb={getMaxUploadMb()}
    />
  );
}
