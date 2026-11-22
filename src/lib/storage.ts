import crypto from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { getMaxUploadBytes, getMaxUploadMb, getStorageBucket } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const ALLOWED_MIMES: Record<string, { ext: string; allowedExtensions: string[] }> = {
  "application/pdf": { ext: "pdf", allowedExtensions: [".pdf"] },
  "image/jpeg": { ext: "jpg", allowedExtensions: [".jpg", ".jpeg"] },
  "image/png": { ext: "png", allowedExtensions: [".png"] },
};

export interface ValidatedFile {
  buffer: Buffer;
  mime: string;
  ext: string;
  size: number;
  originalName: string;
}

export async function validateUploadedFile(file: File): Promise<ValidatedFile> {
  if (!file || file.size === 0) {
    throw new Error("Berkas scan surat wajib diunggah.");
  }

  const maxBytes = getMaxUploadBytes();
  if (file.size > maxBytes) {
    throw new Error(`Ukuran berkas melebihi batas maksimum ${getMaxUploadMb()} MB.`);
  }

  // Sanitize filename to strip any path traversal sequences
  const safeBaseName = path.basename(file.name || "dokumen");
  const ext = path.extname(safeBaseName).toLowerCase();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Inspect magic bytes (never trust client-reported MIME type alone)
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIMES[detected.mime]) {
    throw new Error(
      "Format berkas tidak valid. Hanya berkas PDF, JPG, atau PNG asli yang diizinkan."
    );
  }

  const rule = ALLOWED_MIMES[detected.mime];
  if (ext && !rule.allowedExtensions.includes(ext)) {
    throw new Error(
      "Ekstensi berkas tidak cocok dengan isi file sebenarnya."
    );
  }

  // TODO(security): Integrate antivirus/malware scanning API (e.g. ClamAV / VirusTotal) in sandbox before persistence when STP infrastructure supports it.
  // TODO(security): Apply Content Disarm & Reconstruction (CDR) on PDF uploads to strip active scripts/actions before storage.

  return {
    buffer,
    mime: detected.mime,
    ext: rule.ext,
    size: buffer.byteLength,
    originalName: safeBaseName.slice(0, 180),
  };
}

export async function uploadSuratFile(validated: ValidatedFile): Promise<string> {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const randomName = `${crypto.randomUUID()}.${validated.ext}`;
  const storagePath = `${yyyy}/${mm}/${randomName}`;

  const supabase = createSupabaseAdmin();
  const bucket = getStorageBucket();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, validated.buffer, {
      contentType: validated.mime,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Gagal menyimpan berkas ke storage: ${error.message}`);
  }

  return storagePath;
}

export async function deleteSuratFile(storagePath: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const bucket = getStorageBucket();
  await supabase.storage.from(bucket).remove([storagePath]);
}

export async function downloadSuratFile(storagePath: string): Promise<Buffer> {
  // Guard against any path traversal stored unexpectedly
  if (storagePath.includes("..") || path.isAbsolute(storagePath)) {
    throw new Error("Path berkas tidak valid.");
  }

  const supabase = createSupabaseAdmin();
  const bucket = getStorageBucket();

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(storagePath);

  if (error || !data) {
    throw new Error("Berkas tidak dapat diakses atau tidak ditemukan.");
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
