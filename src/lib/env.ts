export function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:3000";
}

export function getTokenTtlDays(): number {
  const n = Number(process.env.TOKEN_TTL_DAYS ?? "30");
  return Number.isFinite(n) && n >= 1 && n <= 365 ? Math.floor(n) : 30;
}

export function getMaxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? "10");
  const safeMb = Number.isFinite(mb) && mb >= 1 && mb <= 25 ? mb : 10;
  return safeMb * 1024 * 1024;
}

export function getMaxUploadMb(): number {
  return Math.round(getMaxUploadBytes() / (1024 * 1024));
}

export function getReminderDaysBefore(): number {
  const n = Number(process.env.REMINDER_DAYS_BEFORE ?? "3");
  return Number.isFinite(n) && n >= 1 && n <= 30 ? Math.floor(n) : 3;
}

export type WaMode = "manual" | "simulation" | "cloud_api";

export function getWaMode(): WaMode {
  const mode = (process.env.WA_MODE || "manual").toLowerCase();
  if (mode === "simulation" || mode === "cloud_api") return mode;
  return "manual";
}

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "surat";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
  );
}
