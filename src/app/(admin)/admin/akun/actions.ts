"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireSuperadmin } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  createAdminAccountSchema,
  updateAdminAccountSchema,
} from "@/lib/validators";

export interface AkunActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function createAdminAccountAction(input: {
  nama: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN_DIVISI";
  divisiId: string;
  mode: "invite" | "password";
  password?: string;
}): Promise<AkunActionResult> {
  const actor = await requireSuperadmin();
  const parsed = createAdminAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data akun tidak valid.",
    };
  }

  const db = createSupabaseAdmin();
  const emailLower = parsed.data.email.toLowerCase();

  let createdUserId = "";

  if (parsed.data.mode === "invite") {
    const { data, error } = await db.auth.admin.inviteUserByEmail(emailLower, {
      redirectTo: `${getAppUrl()}/login`,
      data: { nama: parsed.data.nama },
    });
    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message.includes("already")
          ? "Email tersebut sudah terdaftar."
          : `Gagal mengirim undangan email: ${error?.message || "coba gunakan mode Password Awal."}`,
      };
    }
    createdUserId = data.user.id;
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: emailLower,
      password: parsed.data.password!,
      email_confirm: true,
      user_metadata: { nama: parsed.data.nama },
    });
    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message.includes("already")
          ? "Email tersebut sudah terdaftar."
          : `Gagal membuat akun: ${error?.message || "terjadi kesalahan."}`,
      };
    }
    createdUserId = data.user.id;
  }

  const { error: profError } = await db.from("profiles").upsert(
    {
      id: createdUserId,
      nama: parsed.data.nama,
      email: emailLower,
      role: parsed.data.role,
      divisi_id: parsed.data.role === "SUPERADMIN" ? null : parsed.data.divisiId,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profError) {
    return {
      ok: false,
      error: "Akun login terbuat tetapi profil gagal disimpan. Coba perbarui dari daftar.",
    };
  }

  await logAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    divisiId: parsed.data.divisiId,
    eventType: "ADMIN_ACCOUNT_CREATED",
    eventData: {
      email: emailLower,
      nama: parsed.data.nama,
      role: parsed.data.role,
      mode: parsed.data.mode,
    },
  });

  revalidatePath("/admin/akun");
  revalidatePath("/admin/divisi");
  return {
    ok: true,
    message:
      parsed.data.mode === "invite"
        ? `Email undangan telah dikirim ke ${emailLower}.`
        : `Akun ${emailLower} berhasil dibuat dan langsung aktif.`,
  };
}

export async function updateAdminAccountAction(input: {
  id: string;
  nama: string;
  role: "SUPERADMIN" | "ADMIN_DIVISI";
  divisiId: string;
  isActive: boolean;
}): Promise<AkunActionResult> {
  const actor = await requireSuperadmin();
  const parsed = updateAdminAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "Data akun tidak valid.",
    };
  }

  if (parsed.data.id === actor.id && !parsed.data.isActive) {
    return {
      ok: false,
      error: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
    };
  }

  if (parsed.data.id === actor.id && parsed.data.role !== "SUPERADMIN") {
    return {
      ok: false,
      error: "Anda tidak dapat menurunkan peran Superadmin Anda sendiri.",
    };
  }

  const db = createSupabaseAdmin();
  const { data: updated, error } = await db
    .from("profiles")
    .update({
      nama: parsed.data.nama,
      role: parsed.data.role,
      divisi_id: parsed.data.role === "SUPERADMIN" ? null : parsed.data.divisiId,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .select("id, email, role, divisi_id, is_active")
    .single();

  if (error || !updated) {
    return { ok: false, error: "Gagal memperbarui akun admin." };
  }

  // Enforce ban/unban & revoke active sessions immediately when deactivated
  await db.auth.admin
    .updateUserById(updated.id, {
      ban_duration: updated.is_active ? "none" : "876000h",
      user_metadata: { nama: parsed.data.nama },
    })
    .catch(() => {});

  if (!updated.is_active) {
    await db.auth.admin.signOut(updated.id, "global").catch(() => {});
  }

  await logAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    divisiId: updated.divisi_id,
    eventType: updated.is_active
      ? "ADMIN_ACCOUNT_UPDATED"
      : "ADMIN_ACCOUNT_DEACTIVATED",
    eventData: {
      email: updated.email,
      role: updated.role,
      isActive: updated.is_active,
    },
  });

  revalidatePath("/admin/akun");
  revalidatePath("/admin/divisi");
  return { ok: true };
}
