import { NextRequest, NextResponse } from "next/server";
import { canViewSurat, getCurrentAdmin } from "@/lib/auth";
import { downloadSuratFile } from "@/lib/storage";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const db = createSupabaseAdmin();

  const { data: surat } = await db
    .from("surat")
    .select("id, divisi_id, file_path, file_mime, file_name")
    .eq("id", id)
    .single();

  if (!surat) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Enforce multi-division read access (Superadmin, owner division, or incoming letter to admin's division)
  const allowed = await canViewSurat(admin, surat.id, surat.divisi_id);
  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await downloadSuratFile(surat.file_path);
    const forceDownload = request.nextUrl.searchParams.get("download") === "1";
    const safeFileName = surat.file_name.replace(/[^\w.\-() ]+/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": surat.file_mime,
        "Content-Disposition": `${
          forceDownload ? "attachment" : "inline"
        }; filename="${safeFileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse("File unavailable", { status: 500 });
  }
}
