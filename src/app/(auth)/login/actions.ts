"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase belum dikonfigurasi. Lengkapi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Email atau password tidak valid.",
    };
  }

  const emailLower = parsed.data.email.toLowerCase();
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const rlKey = `login:${emailLower}:${ip}`;
  const rl = checkRateLimit(rlKey, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryAfterSec / 60);
    return {
      error: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${minutes} menit.`,
    };
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailLower,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      error: "Email atau password salah. Pastikan akun admin sudah terdaftar.",
    };
  }

  resetRateLimit(rlKey);

  if (isSupabaseAdminConfigured()) {
    try {
      await logAudit({
        actorId: data.user.id,
        actorEmail: data.user.email ?? emailLower,
        eventType: "ADMIN_LOGIN",
        eventData: { ip },
      });
    } catch {
      // Do not block login if schema.sql has not been applied yet
    }
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const admin = await getCurrentAdmin();

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut({ scope: "global" });
  }

  if (admin && isSupabaseAdminConfigured()) {
    try {
      await logAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        eventType: "ADMIN_LOGOUT",
      });
    } catch {
      // Ignore audit error during signout
    }
  }

  redirect("/login");
}
