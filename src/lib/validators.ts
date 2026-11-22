import { z } from "zod";

/**
 * Normalizes Indonesian phone numbers to international format 62xxxxxxxxxx.
 */
export function normalizeIndonesianWa(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(160),
  password: z.string().min(8, "Password minimal 8 karakter").max(128),
});

export const penerimaSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(120, "Nama terlalu panjang"),
  jabatan: z
    .string()
    .trim()
    .min(2, "Jabatan wajib diisi")
    .max(120, "Jabatan terlalu panjang"),
  divisi: z.string().trim().max(120, "Divisi terlalu panjang").default(""),
  noWa: z
    .string()
    .trim()
    .transform(normalizeIndonesianWa)
    .refine(
      (val) => /^62\d{8,13}$/.test(val),
      "Nomor WhatsApp harus format internasional Indonesia (contoh: 6281234567890)"
    ),
  isActive: z.boolean().default(true),
});

export const createSuratSchema = z.object({
  perihal: z
    .string()
    .trim()
    .min(3, "Perihal wajib diisi (minimal 3 karakter)")
    .max(300, "Perihal maksimal 300 karakter"),
  pengirim: z
    .string()
    .trim()
    .min(2, "Pengirim / instansi wajib diisi")
    .max(200, "Pengirim maksimal 200 karakter"),
  nomorSurat: z
    .string()
    .trim()
    .max(120, "Nomor surat maksimal 120 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  isSegera: z.boolean().default(false),
  batasTindakLanjut: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }),
  catatan: z
    .string()
    .trim()
    .max(2000, "Catatan disposisi maksimal 2000 karakter")
    .default(""),
  penerimaIds: z
    .array(z.string().min(1))
    .min(1, "Minimal pilih satu penerima disposisi")
    .max(50, "Maksimal 50 penerima dalam satu disposisi"),
});

export const extendTokenSchema = z.object({
  disposisiId: z.string().min(1),
  extraDays: z.coerce
    .number()
    .int()
    .min(1, "Minimal 1 hari")
    .max(180, "Maksimal 180 hari"),
});

export const disposisiActionSchema = z.object({
  disposisiId: z.string().min(1),
});
