"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { canManageSurat, isSuperadmin, requireAdmin } from "@/lib/auth";
import { getTokenTtlDays } from "@/lib/env";
import {
  deleteSuratFile,
  uploadSuratFile,
  validateUploadedFile,
} from "@/lib/storage";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildDispositionUrl,
  computeTokenExpiry,
  generateRawToken,
  hashToken,
} from "@/lib/token";
import {
  createSuratSchema,
  disposisiActionSchema,
  extendTokenSchema,
  updateSuratSchema,
} from "@/lib/validators";
import {
  buildDispositionMessage,
  sendWhatsAppNotification,
} from "@/lib/wa/provider";

export interface CreatedRecipientDispatch {
  disposisiId: string;
  namaPenerima: string;
  jabatan: string;
  divisiNama: string;
  noWa: string;
  waStatus: string;
  waMeUrl: string;
  linkUrl: string;
  summary: string;
}

export interface CreateSuratResult {
  ok: boolean;
  error?: string;
  suratId?: string;
  kodeArsip?: string;
  perihal?: string;
  dispatches?: CreatedRecipientDispatch[];
}

export async function createSuratDisposisiAction(
  formData: FormData
): Promise<CreateSuratResult> {
  const admin = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Berkas scan surat (PDF/JPG/PNG) wajib diunggah." };
  }

  const rawPenerimaIds = formData
    .getAll("penerimaIds")
    .map((v) => String(v))
    .filter(Boolean);

  // Admin Divisi is locked to their own division; Superadmin picks sender division
  const resolvedDivisiId = isSuperadmin(admin)
    ? String(formData.get("divisiId") || "")
    : admin.divisiId || "";

  if (!resolvedDivisiId) {
    return {
      ok: false,
      error:
        "Akun Anda belum terhubung ke divisi mana pun. Hubungi Superadmin untuk mengatur divisi akun Anda.",
    };
  }

  const parsed = createSuratSchema.safeParse({
    divisiId: resolvedDivisiId,
    perihal: formData.get("perihal"),
    pengirim: formData.get("pengirim"),
    nomorSurat: formData.get("nomorSurat") || undefined,
    isSegera: formData.get("isSegera") === "true",
    batasTindakLanjut: formData.get("batasTindakLanjut") || undefined,
    catatan: formData.get("catatan") || "",
    penerimaIds: Array.from(new Set(rawPenerimaIds)),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Periksa kembali isian formulir.",
    };
  }

  const db = createSupabaseAdmin();

  const { data: recipients, error: recError } = await db
    .from("penerima")
    .select("id, nama, jabatan, divisi, no_wa, divisi_rel:divisi(nama)")
    .in("id", parsed.data.penerimaIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (
    recError ||
    !recipients ||
    recipients.length !== parsed.data.penerimaIds.length
  ) {
    return {
      ok: false,
      error: "Sebagian penerima yang dipilih tidak valid atau sudah nonaktif.",
    };
  }

  let validatedFile;
  try {
    validatedFile = await validateUploadedFile(file);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Berkas tidak valid.",
    };
  }

  let uploadedPath: string | null = null;
  try {
    uploadedPath = await uploadSuratFile(validatedFile);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal mengunggah berkas.",
    };
  }

  const expiresAt = computeTokenExpiry(getTokenTtlDays());
  const recipientTokens = recipients.map((r) => {
    const rawToken = generateRawToken();
    const divRel = Array.isArray(r.divisi_rel) ? r.divisi_rel[0] : r.divisi_rel;
    return {
      recipient: {
        id: r.id,
        nama: r.nama,
        jabatan: r.jabatan,
        no_wa: r.no_wa,
        divisiNama: divRel?.nama || r.divisi || "-",
      },
      rawToken,
      tokenHash: hashToken(rawToken),
    };
  });

  const batasDateStr = parsed.data.batasTindakLanjut
    ? parsed.data.batasTindakLanjut.toISOString().slice(0, 10)
    : null;

  const { data: rpcResult, error: rpcError } = await db.rpc(
    "create_surat_with_disposisi",
    {
      p_divisi_id: parsed.data.divisiId,
      p_perihal: parsed.data.perihal,
      p_pengirim: parsed.data.pengirim,
      p_nomor_surat: parsed.data.nomorSurat,
      p_file_path: uploadedPath,
      p_file_name: validatedFile.originalName,
      p_file_mime: validatedFile.mime,
      p_file_size: validatedFile.size,
      p_is_segera: parsed.data.isSegera,
      p_batas_tindak_lanjut: batasDateStr,
      p_created_by: admin.id,
      p_actor_email: admin.email,
      p_catatan: parsed.data.catatan,
      p_recipients: recipientTokens.map((item) => ({
        penerima_id: item.recipient.id,
        token_hash: item.tokenHash,
        token_expires_at: expiresAt.toISOString(),
      })),
    }
  );

  if (rpcError || !rpcResult) {
    if (uploadedPath) {
      await deleteSuratFile(uploadedPath).catch(() => {});
    }
    return {
      ok: false,
      error:
        "Penyimpanan surat gagal. Tidak ada kode arsip atau disposisi parsial yang dibuat.",
    };
  }

  const created = rpcResult as {
    surat_id: string;
    kode_arsip: string;
    disposisi: Array<{ disposisi_id: string; penerima_id: string }>;
  };

  const dispIdByPenerima = new Map<string, string>();
  for (const row of created.disposisi) {
    dispIdByPenerima.set(row.penerima_id, row.disposisi_id);
  }

  const dispatches: CreatedRecipientDispatch[] = [];

  for (const item of recipientTokens) {
    const disposisiId = dispIdByPenerima.get(item.recipient.id)!;
    const linkUrl = buildDispositionUrl(item.rawToken);
    const message = buildDispositionMessage({
      namaPenerima: item.recipient.nama,
      kodeArsip: created.kode_arsip,
      perihal: parsed.data.perihal,
      pengirim: parsed.data.pengirim,
      isSegera: parsed.data.isSegera,
      catatan: parsed.data.catatan,
      batasTindakLanjut: parsed.data.batasTindakLanjut,
      linkUrl,
      expiresAt,
    });

    const waResult = await sendWhatsAppNotification(
      item.recipient.no_wa,
      message
    );

    let nextWaStatus: "PENDING" | "SENT" | "FAILED" = "PENDING";
    if (waResult.mode !== "manual") {
      nextWaStatus = waResult.ok ? "SENT" : "FAILED";
      const nowIso = new Date().toISOString();
      await db
        .from("disposisi")
        .update({
          wa_status: nextWaStatus,
          wa_sent_at: waResult.ok ? nowIso : null,
          updated_at: nowIso,
        })
        .eq("id", disposisiId);

      await db.from("wa_delivery_logs").insert({
        disposisi_id: disposisiId,
        provider: waResult.provider,
        provider_message_id: waResult.messageId,
        status: nextWaStatus,
        response_code: waResult.code,
        response_summary: waResult.summary,
      });

      await logAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        divisiId: parsed.data.divisiId,
        suratId: created.surat_id,
        disposisiId,
        eventType: "WA_ATTEMPT",
        eventData: {
          provider: waResult.provider,
          status: nextWaStatus,
          code: waResult.code,
        },
      });
    }

    dispatches.push({
      disposisiId,
      namaPenerima: item.recipient.nama,
      jabatan: item.recipient.jabatan,
      divisiNama: item.recipient.divisiNama,
      noWa: item.recipient.no_wa,
      waStatus: nextWaStatus,
      waMeUrl: waResult.waMeUrl,
      linkUrl,
      summary: waResult.summary,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/surat");

  return {
    ok: true,
    suratId: created.surat_id,
    kodeArsip: created.kode_arsip,
    perihal: parsed.data.perihal,
    dispatches,
  };
}

async function fetchDisposisiWithOwnerCheck(disposisiId: string) {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const { data: disp } = await db
    .from("disposisi")
    .select(
      "id, surat_id, catatan, token_version, revoked_at, token_expires_at, surat(divisi_id, kode_arsip, perihal, pengirim, is_segera, batas_tindak_lanjut), penerima(nama, no_wa)"
    )
    .eq("id", disposisiId)
    .single();

  if (!disp) {
    return { error: "Disposisi tidak ditemukan." as const };
  }

  const suratObj = Array.isArray(disp.surat) ? disp.surat[0] : disp.surat;
  const penerimaObj = Array.isArray(disp.penerima)
    ? disp.penerima[0]
    : disp.penerima;

  if (!suratObj || !penerimaObj) {
    return { error: "Data surat atau penerima tidak ditemukan." as const };
  }

  if (!canManageSurat(admin, suratObj.divisi_id)) {
    return {
      error:
        "Hanya divisi pengirim atau Superadmin yang dapat mengubah tautan surat ini." as const,
    };
  }

  return { admin, db, disp, suratObj, penerimaObj };
}

export async function markWaManualSentAction(
  disposisiId: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = disposisiActionSchema.safeParse({ disposisiId });
  if (!parsed.success) return { ok: false, error: "ID disposisi tidak valid." };

  const check = await fetchDisposisiWithOwnerCheck(parsed.data.disposisiId);
  if ("error" in check) return { ok: false, error: check.error };

  const { admin, db, disp, suratObj } = check;
  const nowIso = new Date().toISOString();

  await db
    .from("disposisi")
    .update({
      wa_status: "DIKIRIM_MANUAL",
      wa_sent_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", disp.id);

  await db.from("wa_delivery_logs").insert({
    disposisi_id: disp.id,
    provider: "wa.me-manual",
    status: "DIKIRIM_MANUAL",
    response_code: "MANUAL_CONFIRMED",
    response_summary: `Ditandai terkirim manual via wa.me oleh ${admin.email}`,
    attempted_at: nowIso,
  });

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: suratObj.divisi_id,
    suratId: disp.surat_id,
    disposisiId: disp.id,
    eventType: "WA_MANUAL_MARKED_SENT",
    eventData: { markedAt: nowIso },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${disp.surat_id}`);
  return { ok: true };
}

export async function revokeTokenAction(
  disposisiId: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = disposisiActionSchema.safeParse({ disposisiId });
  if (!parsed.success) return { ok: false, error: "ID disposisi tidak valid." };

  const check = await fetchDisposisiWithOwnerCheck(parsed.data.disposisiId);
  if ("error" in check) return { ok: false, error: check.error };

  const { admin, db, disp, suratObj } = check;
  const nowIso = new Date().toISOString();

  await db
    .from("disposisi")
    .update({ revoked_at: nowIso, updated_at: nowIso })
    .eq("id", disp.id);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: suratObj.divisi_id,
    suratId: disp.surat_id,
    disposisiId: disp.id,
    eventType: "TOKEN_REVOKED",
    eventData: { revokedAt: nowIso, tokenVersion: disp.token_version },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${disp.surat_id}`);
  return { ok: true };
}

export async function extendTokenAction(
  disposisiId: string,
  extraDays: number
): Promise<{ ok: boolean; error?: string; newExpiresAt?: string }> {
  const parsed = extendTokenSchema.safeParse({ disposisiId, extraDays });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Input perpanjangan tidak valid.",
    };
  }

  const check = await fetchDisposisiWithOwnerCheck(parsed.data.disposisiId);
  if ("error" in check) return { ok: false, error: check.error };

  const { admin, db, disp, suratObj } = check;
  if (disp.revoked_at) {
    return {
      ok: false,
      error:
        "Tautan sudah dinonaktifkan. Gunakan tombol Buat Tautan Baru untuk membuat akses baru.",
    };
  }

  const now = new Date();
  const currentExp = new Date(disp.token_expires_at);
  const baseDate = currentExp > now ? currentExp : now;
  const newExpiresAt = computeTokenExpiry(parsed.data.extraDays, baseDate);

  await db
    .from("disposisi")
    .update({
      token_expires_at: newExpiresAt.toISOString(),
      reminder_sent_at: null,
      updated_at: now.toISOString(),
    })
    .eq("id", disp.id);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: suratObj.divisi_id,
    suratId: disp.surat_id,
    disposisiId: disp.id,
    eventType: "TOKEN_EXTENDED",
    eventData: {
      oldExpiresAt: disp.token_expires_at,
      newExpiresAt: newExpiresAt.toISOString(),
      extraDays: parsed.data.extraDays,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${disp.surat_id}`);
  return { ok: true, newExpiresAt: newExpiresAt.toISOString() };
}

export async function reissueTokenAction(disposisiId: string): Promise<{
  ok: boolean;
  error?: string;
  waMeUrl?: string;
  linkUrl?: string;
  newExpiresAt?: string;
}> {
  const parsed = disposisiActionSchema.safeParse({ disposisiId });
  if (!parsed.success) return { ok: false, error: "ID disposisi tidak valid." };

  const check = await fetchDisposisiWithOwnerCheck(parsed.data.disposisiId);
  if ("error" in check) return { ok: false, error: check.error };

  const { admin, db, disp, suratObj, penerimaObj } = check;

  const rawToken = generateRawToken();
  const newTokenHash = hashToken(rawToken);
  const newExpiresAt = computeTokenExpiry(getTokenTtlDays());
  const nextVersion = disp.token_version + 1;
  const nowIso = new Date().toISOString();

  await db
    .from("disposisi")
    .update({
      token_hash: newTokenHash,
      token_version: nextVersion,
      token_expires_at: newExpiresAt.toISOString(),
      revoked_at: null,
      wa_status: "PENDING",
      reminder_sent_at: null,
      updated_at: nowIso,
    })
    .eq("id", disp.id);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: suratObj.divisi_id,
    suratId: disp.surat_id,
    disposisiId: disp.id,
    eventType: "TOKEN_REISSUED",
    eventData: {
      previousVersion: disp.token_version,
      tokenVersion: nextVersion,
      newExpiresAt: newExpiresAt.toISOString(),
    },
  });

  const linkUrl = buildDispositionUrl(rawToken);
  const message = buildDispositionMessage({
    namaPenerima: penerimaObj.nama,
    kodeArsip: suratObj.kode_arsip,
    perihal: suratObj.perihal,
    pengirim: suratObj.pengirim,
    isSegera: suratObj.is_segera,
    catatan: disp.catatan,
    batasTindakLanjut: suratObj.batas_tindak_lanjut
      ? new Date(suratObj.batas_tindak_lanjut)
      : null,
    linkUrl,
    expiresAt: newExpiresAt,
  });

  const waResult = await sendWhatsAppNotification(penerimaObj.no_wa, message);

  if (waResult.mode !== "manual") {
    const nextStatus = waResult.ok ? "SENT" : "FAILED";
    await db
      .from("disposisi")
      .update({
        wa_status: nextStatus,
        wa_sent_at: waResult.ok ? nowIso : null,
        updated_at: nowIso,
      })
      .eq("id", disp.id);

    await db.from("wa_delivery_logs").insert({
      disposisi_id: disp.id,
      provider: waResult.provider,
      provider_message_id: waResult.messageId,
      status: nextStatus,
      response_code: waResult.code,
      response_summary: waResult.summary,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${disp.surat_id}`);

  return {
    ok: true,
    waMeUrl: waResult.waMeUrl,
    linkUrl,
    newExpiresAt: newExpiresAt.toISOString(),
  };
}

export async function markReminderSentAction(
  disposisiId: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = disposisiActionSchema.safeParse({ disposisiId });
  if (!parsed.success) return { ok: false, error: "ID disposisi tidak valid." };

  const check = await fetchDisposisiWithOwnerCheck(parsed.data.disposisiId);
  if ("error" in check) return { ok: false, error: check.error };

  const { admin, db, disp, suratObj } = check;
  const nowIso = new Date().toISOString();

  await db
    .from("disposisi")
    .update({ reminder_sent_at: nowIso, updated_at: nowIso })
    .eq("id", disp.id);

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: suratObj.divisi_id,
    suratId: disp.surat_id,
    disposisiId: disp.id,
    eventType: "REMINDER_SENT",
    eventData: { method: "manual_wa", sentAt: nowIso },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/surat/${disp.surat_id}`);
  return { ok: true };
}

export async function updateSuratAction(input: {
  suratId: string;
  perihal: string;
  pengirim: string;
  nomorSurat?: string;
  isSegera: boolean;
  batasTindakLanjut?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const parsed = updateSuratSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data surat tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: existing } = await db
    .from("surat")
    .select("id, divisi_id, kode_arsip")
    .eq("id", parsed.data.suratId)
    .single();

  if (!existing) {
    return { ok: false, error: "Surat tidak ditemukan." };
  }

  if (!canManageSurat(admin, existing.divisi_id)) {
    return {
      ok: false,
      error:
        "Hanya divisi pengirim atau Superadmin yang dapat mengubah informasi surat ini.",
    };
  }

  const { error } = await db
    .from("surat")
    .update({
      perihal: parsed.data.perihal,
      pengirim: parsed.data.pengirim,
      nomor_surat: parsed.data.nomorSurat,
      is_segera: parsed.data.isSegera,
      batas_tindak_lanjut: parsed.data.batasTindakLanjut,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    return { ok: false, error: "Gagal menyimpan perubahan surat." };
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: existing.divisi_id,
    suratId: existing.id,
    eventType: "SURAT_UPDATED",
    eventData: {
      kodeArsip: existing.kode_arsip,
      perihal: parsed.data.perihal,
      pengirim: parsed.data.pengirim,
      isSegera: parsed.data.isSegera,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${existing.id}`);
  return { ok: true };
}

export async function deleteSuratAction(
  suratId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const db = createSupabaseAdmin();

  const { data: existing } = await db
    .from("surat")
    .select("id, divisi_id, kode_arsip, perihal, file_path")
    .eq("id", suratId)
    .single();

  if (!existing) {
    return { ok: false, error: "Surat tidak ditemukan." };
  }

  if (!canManageSurat(admin, existing.divisi_id)) {
    return {
      ok: false,
      error:
        "Hanya divisi pengirim atau Superadmin yang dapat menghapus surat ini.",
    };
  }

  // Record audit log BEFORE deleting (surat_id will become NULL via ON DELETE SET NULL, preserving audit trail)
  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    divisiId: existing.divisi_id,
    suratId: existing.id,
    eventType: "SURAT_CANCELLED",
    eventData: {
      kodeArsip: existing.kode_arsip,
      perihal: existing.perihal,
      deleted: true,
    },
  });

  const { error } = await db.from("surat").delete().eq("id", existing.id);
  if (error) {
    return { ok: false, error: "Gagal menghapus surat." };
  }

  if (existing.file_path) {
    await deleteSuratFile(existing.file_path).catch(() => {});
  }

  revalidatePath("/admin");
  revalidatePath("/admin/surat");
  revalidatePath("/admin/audit");
  return { ok: true };
}
