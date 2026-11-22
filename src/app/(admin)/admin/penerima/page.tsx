import React from "react";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PenerimaClient, type PenerimaRow } from "./PenerimaClient";

export const metadata = {
  title: "Master Penerima — SIDISPO",
};

export default async function PenerimaPage() {
  const db = createSupabaseAdmin();
  const { data: rows } = await db
    .from("penerima")
    .select("id, nama, jabatan, divisi, no_wa, is_active, disposisi(count)")
    .is("deleted_at", null)
    .order("is_active", { ascending: false })
    .order("nama", { ascending: true });

  const items: PenerimaRow[] = (rows ?? []).map((r) => {
    const countArr = r.disposisi as Array<{ count: number }> | null;
    return {
      id: r.id,
      nama: r.nama,
      jabatan: r.jabatan,
      divisi: r.divisi,
      noWa: r.no_wa,
      isActive: r.is_active,
      disposisiCount: countArr?.[0]?.count ?? 0,
    };
  });

  return <PenerimaClient items={items} />;
}
