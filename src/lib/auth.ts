import { redirect } from "next/navigation";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  nama: string;
  role: string;
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

    if (isSupabaseAdminConfigured()) {
      const adminDb = createSupabaseAdmin();
      const { data: profile } = await adminDb
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email,
            nama: displayName,
            role: "ADMIN_SEKRETARIAT",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("id, email, nama, role")
        .single();

      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          nama: profile.nama,
          role: profile.role,
        };
      }
    }

    return {
      id: user.id,
      email: user.email,
      nama: displayName,
      role: "ADMIN_SEKRETARIAT",
    };
  } catch {
    // Fail closed when session validation encounters an error
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
