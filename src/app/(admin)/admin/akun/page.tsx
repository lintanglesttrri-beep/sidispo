import React from "react";
import { requireSuperadmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  AkunClient,
  type AkunItem,
  type DivisiSimpleOption,
} from "./AkunClient";

export const metadata = {
  title: "Kelola Akun Admin — SIDISPO",
};

export default async function AkunPage() {
  const currentAdmin = await requireSuperadmin();
  const db = createSupabaseAdmin();

  const [profilesRes, divisiRes] = await Promise.all([
    db
      .from("profiles")
      .select("id, nama, email, role, divisi_id, is_active, divisi(nama, kode)")
      .order("role", { ascending: false })
      .order("nama", { ascending: true }),
    db
      .from("divisi")
      .select("id, nama, kode")
      .eq("is_active", true)
      .order("nama", { ascending: true }),
  ]);

  const items: AkunItem[] = (profilesRes.data ?? []).map((p) => {
    const divObj = Array.isArray(p.divisi) ? p.divisi[0] : p.divisi;
    return {
      id: p.id,
      nama: p.nama,
      email: p.email,
      role: p.role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN_DIVISI",
      divisiId: p.divisi_id ?? null,
      divisiNama: divObj?.nama ?? null,
      divisiKode: divObj?.kode ?? null,
      isActive: p.is_active,
    };
  });

  const divisiList: DivisiSimpleOption[] = divisiRes.data ?? [];

  return (
    <AkunClient
      items={items}
      divisiList={divisiList}
      currentAdminId={currentAdmin.id}
    />
  );
}
