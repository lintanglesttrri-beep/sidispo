"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { isSuperadmin, requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { penerimaSchema } from "@/lib/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createPenerimaAction(input: {
  nama: string;
  jabatan: string;
  divisiId: string;
  noWa: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const targetDivisiId = isSuperadmin(admin)
    ? input.divisiId
    : admin.divisiId || "";

  const parsed = penerimaSchema.safeParse({
    ...input,
    divisiId: targetDivisiId,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: divRow } = await db
    .from("divisi")
    .select("id, nama")
    .eq("id", parsed.data.divisiId)
    .single();

  if (!divRow) {
    return { ok: false, error: "Divisi yang dipilih tidak ditemukan." };
  }

  const { data: created, error } = await db
    .from("penerima")
    .insert({
      nama: parsed.data.nama,
      jabatan: parsed.data.jabatan,
      divisi: divRow.nama,
      divisi_id: divRow.id,
      no_wa: parsed.data.noWa,
      is_active: parsed.data.isActive,
    })
    .select("id, nama")
    .single();

  if (error || !created) {
    return { ok: false, error: "Gagal menyimpan data penerima." };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: divRow.id,
    eventType: "PENERIMA_CREATED",
    eventData: { penerimaId: created.id, nama: created.nama, divisi: divRow.nama },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  revalidatePath("/admin/divisi");
  return { ok: true };
}

export async function updatePenerimaAction(
  id: string,
  input: {
    nama: string;
    jabatan: string;
    divisiId: string;
    noWa: string;
    isActive: boolean;
  }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const { data: existing } = await db
    .from("penerima")
    .select("id, divisi_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return { ok: false, error: "Data penerima tidak ditemukan." };
  }

  if (!isSuperadmin(admin) && existing.divisi_id !== admin.divisiId) {
    return {
      ok: false,
      error: "Anda hanya dapat mengubah penerima di divisi Anda sendiri.",
    };
  }

  const targetDivisiId = isSuperadmin(admin)
    ? input.divisiId
    : admin.divisiId || "";

  const parsed = penerimaSchema.safeParse({
    ...input,
    divisiId: targetDivisiId,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid.",
    };
  }

  const { data: divRow } = await db
    .from("divisi")
    .select("id, nama")
    .eq("id", parsed.data.divisiId)
    .single();

  if (!divRow) {
    return { ok: false, error: "Divisi yang dipilih tidak ditemukan." };
  }

  const { data: updated, error } = await db
    .from("penerima")
    .update({
      nama: parsed.data.nama,
      jabatan: parsed.data.jabatan,
      divisi: divRow.nama,
      divisi_id: divRow.id,
      no_wa: parsed.data.noWa,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, nama")
    .single();

  if (error || !updated) {
    return { ok: false, error: "Gagal memperbarui data penerima." };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: divRow.id,
    eventType: "PENERIMA_UPDATED",
    eventData: { penerimaId: updated.id, nama: updated.nama, divisi: divRow.nama },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  revalidatePath("/admin/divisi");
  return { ok: true };
}

export async function togglePenerimaActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const { data: existing } = await db
    .from("penerima")
    .select("id, divisi_id")
    .eq("id", id)
    .single();

  if (!existing) return { ok: false, error: "Penerima tidak ditemukan." };
  if (!isSuperadmin(admin) && existing.divisi_id !== admin.divisiId) {
    return {
      ok: false,
      error: "Anda hanya dapat mengubah penerima di divisi Anda sendiri.",
    };
  }

  const { error } = await db
    .from("penerima")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Gagal mengubah status aktif penerima." };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: existing.divisi_id,
    eventType: "PENERIMA_UPDATED",
    eventData: { penerimaId: id, isActive },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}

export async function deletePenerimaAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const { data: existing } = await db
    .from("penerima")
    .select("id, divisi_id")
    .eq("id", id)
    .single();

  if (!existing) return { ok: false, error: "Penerima tidak ditemukan." };
  if (!isSuperadmin(admin) && existing.divisi_id !== admin.divisiId) {
    return {
      ok: false,
      error: "Anda hanya dapat menghapus penerima di divisi Anda sendiri.",
    };
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from("penerima")
    .update({ deleted_at: now, is_active: false, updated_at: now })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Gagal menghapus penerima." };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: existing.divisi_id,
    eventType: "PENERIMA_DELETED",
    eventData: { penerimaId: id },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  revalidatePath("/admin/divisi");
  return { ok: true };
}
