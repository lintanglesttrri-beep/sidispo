"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { penerimaSchema } from "@/lib/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createPenerimaAction(input: {
  nama: string;
  jabatan: string;
  divisi: string;
  noWa: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = penerimaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: created, error } = await db
    .from("penerima")
    .insert({
      nama: parsed.data.nama,
      jabatan: parsed.data.jabatan,
      divisi: parsed.data.divisi,
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
    eventType: "PENERIMA_CREATED",
    eventData: { penerimaId: created.id, nama: created.nama },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}

export async function updatePenerimaAction(
  id: string,
  input: {
    nama: string;
    jabatan: string;
    divisi: string;
    noWa: string;
    isActive: boolean;
  }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = penerimaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: updated, error } = await db
    .from("penerima")
    .update({
      nama: parsed.data.nama,
      jabatan: parsed.data.jabatan,
      divisi: parsed.data.divisi,
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
    eventType: "PENERIMA_UPDATED",
    eventData: { penerimaId: updated.id, nama: updated.nama },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}

export async function togglePenerimaActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

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
    eventType: "PENERIMA_DELETED",
    eventData: { penerimaId: id },
  });

  revalidatePath("/admin/penerima");
  revalidatePath("/admin/surat/baru");
  return { ok: true };
}
