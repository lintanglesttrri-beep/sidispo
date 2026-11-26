import { redirect } from "next/navigation";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/types";

export interface AdminUser {
  id: string;
  email: string;
  nama: string;
  role: AdminRole;
  divisiId: string | null;
  divisiNama: string | null;
  divisiKode: string | null;
  isActive: boolean;
}

export function isSuperadmin(admin: AdminUser): boolean {
  return admin.role === "SUPERADMIN";
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return null;
    }

    const displayName =
      (typeof user.user_metadata?.nama === "string" &&
        user.user_metadata.nama.trim()) ||
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      user.email.split("@")[0];

    if (!isSupabaseAdminConfigured()) {
      return {
        id: user.id,
        email: user.email,
        nama: displayName,
        role: "SUPERADMIN",
        divisiId: null,
        divisiNama: null,
        divisiKode: null,
        isActive: true,
      };
    }

    const adminDb = createSupabaseAdmin();

    // Check existing profile first so we do not overwrite role/divisi/is_active
    const { data: existing } = await adminDb
      .from("profiles")
      .select("id, email, nama, role, divisi_id, is_active, divisi(id, nama, kode)")
      .eq("id", user.id)
      .single();

    if (existing) {
      if (!existing.is_active) {
        return null;
      }

      const normalizedRole: AdminRole =
        existing.role === "SUPERADMIN" || existing.role === "ADMIN_SEKRETARIAT"
          ? "SUPERADMIN"
          : "ADMIN_DIVISI";

      const divObj = Array.isArray(existing.divisi)
        ? existing.divisi[0]
        : existing.divisi;

      return {
        id: existing.id,
        email: existing.email,
        nama: existing.nama,
        role: normalizedRole,
        divisiId: existing.divisi_id ?? null,
        divisiNama: divObj?.nama ?? null,
        divisiKode: divObj?.kode ?? null,
        isActive: existing.is_active,
      };
    }

    // Bootstrap first-ever profile: if zero profiles exist, first user becomes SUPERADMIN
    const { count } = await adminDb
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const bootstrapRole: AdminRole = (count ?? 0) === 0 ? "SUPERADMIN" : "ADMIN_DIVISI";
    const { data: created } = await adminDb
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        nama: displayName,
        role: bootstrapRole,
        is_active: true,
      })
      .select("id, email, nama, role, divisi_id, is_active")
      .single();

    if (!created) return null;

    return {
      id: created.id,
      email: created.email,
      nama: created.nama,
      role: created.role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN_DIVISI",
      divisiId: created.divisi_id ?? null,
      divisiNama: null,
      divisiKode: null,
      isActive: created.is_active,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }
  return admin;
}

export async function requireSuperadmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPERADMIN") {
    redirect("/admin");
  }
  return admin;
}

/**
 * Checks if an admin can manage (modify/revoke/extend/reissue) a letter.
 */
export function canManageSurat(admin: AdminUser, suratDivisiId: string): boolean {
  if (admin.role === "SUPERADMIN") return true;
  return Boolean(admin.divisiId && admin.divisiId === suratDivisiId);
}

/**
 * Checks if an admin can view a letter (owner division, superadmin, or incoming letter to their division's recipients).
 */
export async function canViewSurat(
  admin: AdminUser,
  suratId: string,
  suratDivisiId: string
): Promise<boolean> {
  if (canManageSurat(admin, suratDivisiId)) return true;
  if (!admin.divisiId) return false;

  const db = createSupabaseAdmin();
  const { data } = await db
    .from("disposisi")
    .select("id, penerima!inner(divisi_id)")
    .eq("surat_id", suratId)
    .eq("penerima.divisi_id", admin.divisiId)
    .limit(1);

  return Boolean(data && data.length > 0);
}
