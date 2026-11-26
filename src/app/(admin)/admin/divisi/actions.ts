"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireSuperadmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { divisiSchema } from "@/lib/validators";

export interface DivisiActionResult {
  ok: boolean;
  error?: string;
}

export async function createDivisiAction(input: {
  nama: string;
  kode: string;
  kontakNama: string;
  kontakWa: string;
  isActive: boolean;
}): Promise<DivisiActionResult> {
  const admin = await requireSuperadmin();
  const parsed = divisiSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data divisi tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: created, error } = await db
    .from("divisi")
    .insert({
      nama: parsed.data.nama,
      kode: parsed.data.kode,
      kontak_nama: parsed.data.kontakNama,
      kontak_wa: parsed.data.kontakWa,
      is_active: parsed.data.isActive,
    })
    .select("id, nama, kode")
    .single();

  if (error || !created) {
    const isDuplicate = error?.code === "23505";
    return {
      ok: false,
      error: isDuplicate
        ? "Nama atau kode divisi sudah dipakai. Gunakan kode yang berbeda."
        : "Gagal menyimpan divisi baru.",
    };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: created.id,
    eventType: "DIVISI_CREATED",
    eventData: { nama: created.nama, kode: created.kode },
  });

  revalidatePath("/admin/divisi");
  revalidatePath("/admin/akun");
  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}

export async function updateDivisiAction(
  id: string,
  input: {
    nama: string;
    kode: string;
    kontakNama: string;
    kontakWa: string;
    isActive: boolean;
  }
): Promise<DivisiActionResult> {
  const admin = await requireSuperadmin();
  const parsed = divisiSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data divisi tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: updated, error } = await db
    .from("divisi")
    .update({
      nama: parsed.data.nama,
      kode: parsed.data.kode,
      kontak_nama: parsed.data.kontakNama,
      kontak_wa: parsed.data.kontakWa,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, nama, kode")
    .single();

  if (error || !updated) {
    const isDuplicate = error?.code === "23505";
    return {
      ok: false,
      error: isDuplicate
        ? "Nama atau kode divisi sudah digunakan divisi lain."
        : "Gagal memperbarui data divisi.",
    };
  }

  // Keep denormalized penerima.divisi name in sync
  await db
    .from("penerima")
    .update({ divisi: updated.nama })
    .eq("divisi_id", updated.id);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: updated.id,
    eventType: "DIVISI_UPDATED",
    eventData: { nama: updated.nama, kode: updated.kode },
  });

  revalidatePath("/admin/divisi");
  revalidatePath("/admin/akun");
  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}

export async function toggleDivisiActiveAction(
  id: string,
  isActive: boolean
): Promise<DivisiActionResult> {
  const admin = await requireSuperadmin();
  const db = createSupabaseAdmin();

  const { data: updated, error } = await db
    .from("divisi")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, nama, kode")
    .single();

  if (error || !updated) {
    return { ok: false, error: "Gagal mengubah status divisi." };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: updated.id,
    eventType: "DIVISI_UPDATED",
    eventData: { nama: updated.nama, kode: updated.kode, isActive },
  });

  revalidatePath("/admin/divisi");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}
