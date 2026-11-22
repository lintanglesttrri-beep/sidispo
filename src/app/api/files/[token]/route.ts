import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { downloadSuratFile } from "@/lib/storage";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { hashToken, isValidTokenFormat } from "@/lib/token";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rl = checkRateLimit(`file-token:${ip}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSec) },
    });
  }

  const { token: rawToken } = await context.params;
  if (!isSupabaseAdminConfigured() || !isValidTokenFormat(rawToken)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const tokenHash = hashToken(rawToken);
  const db = createSupabaseAdmin();
  const now = new Date();

  const { data: disposisi } = await db
    .from("disposisi")
    .select(
      "revoked_at, token_expires_at, surat(file_path, file_mime, file_name)"
    )
    .eq("token_hash", tokenHash)
    .single();

  if (
    !disposisi ||
    disposisi.revoked_at ||
    new Date(disposisi.token_expires_at) <= now
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const suratObj = Array.isArray(disposisi.surat)
    ? disposisi.surat[0]
    : disposisi.surat;
  if (!suratObj) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const buffer = await downloadSuratFile(suratObj.file_path);
    const forceDownload = request.nextUrl.searchParams.get("download") === "1";
    const safeFileName = suratObj.file_name.replace(/[^\w.\-() ]+/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": suratObj.file_mime,
        "Content-Disposition": `${
          forceDownload ? "attachment" : "inline"
        }; filename="${safeFileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new NextResponse("File unavailable", { status: 500 });
  }
}
