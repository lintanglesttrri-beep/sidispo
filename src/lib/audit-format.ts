import { formatTanggalIndo } from "@/lib/format";

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  SURAT_CREATED: "Surat & disposisi dicatat",
  SURAT_UPDATED: "Informasi surat diperbarui",
  SURAT_CANCELLED: "Surat dibatalkan",
  WA_ATTEMPT: "Pengiriman WhatsApp diproses",
  WA_MANUAL_OPENED: "Tautan WhatsApp dibuka",
  WA_MANUAL_MARKED_SENT: "WhatsApp ditandai terkirim",
  WA_RESENT: "Notifikasi WhatsApp dikirim ulang",
  LINK_OPENED: "Tautan dibuka pertama kali oleh penerima",
  LINK_OPENED_REPEAT: "Tautan dibuka kembali oleh penerima",
  CONFIRMED: "Penerimaan surat dikonfirmasi",
  TOKEN_REVOKED: "Tautan dinonaktifkan oleh admin",
  TOKEN_EXTENDED: "Masa berlaku tautan diperpanjang",
  TOKEN_REISSUED: "Tautan baru dibuat oleh admin",
  REMINDER_SENT: "Pengingat konfirmasi dikirim",
  PENERIMA_CREATED: "Penerima baru ditambahkan",
  PENERIMA_UPDATED: "Data penerima diperbarui",
  PENERIMA_DELETED: "Penerima dihapus dari daftar",
  ADMIN_LOGIN: "Admin masuk ke sistem",
  ADMIN_LOGOUT: "Admin keluar dari sistem",
};

export function getAuditEventLabel(eventType: string): string {
  return AUDIT_EVENT_LABELS[eventType] || "Aktivitas sistem";
}

export function formatAuditSummary(
  eventType: string,
  rawData: Record<string, unknown> | string | null | undefined
): string {
  if (!rawData) return "-";
  let data: Record<string, unknown> | null = null;

  if (typeof rawData === "string") {
    try {
      data = JSON.parse(rawData) as Record<string, unknown>;
    } catch {
      return "-";
    }
  } else {
    data = rawData;
  }

  if (!data) return "-";

  switch (eventType) {
    case "SURAT_CREATED": {
      const jumlah = data.jumlahPenerima ? `${data.jumlahPenerima} penerima` : "";
      const segera = data.isSegera ? " • Sifat Segera" : "";
      return [data.perihal ? `Perihal: ${String(data.perihal)}` : "", jumlah]
        .filter(Boolean)
        .join(" • ") + segera;
    }
    case "TOKEN_EXTENDED": {
      const days = data.extraDays ? `+${String(data.extraDays)} hari` : "";
      const until = data.newExpiresAt
        ? `berlaku s.d. ${formatTanggalIndo(String(data.newExpiresAt))}`
        : "";
      return [days, until].filter(Boolean).join(", ") || "Masa berlaku diperpanjang";
    }
    case "TOKEN_REISSUED": {
      const ver = data.tokenVersion ? `Tautan #${String(data.tokenVersion)}` : "";
      const until = data.newExpiresAt
        ? `berlaku s.d. ${formatTanggalIndo(String(data.newExpiresAt))}`
        : "";
      return [ver, until].filter(Boolean).join(" • ") || "Tautan baru dibuat";
    }
    case "TOKEN_REVOKED":
      return "Tautan penerima tidak dapat diakses lagi";
    case "WA_MANUAL_MARKED_SENT":
      return "Dikirim melalui WhatsApp oleh admin";
    case "REMINDER_SENT":
      return "Pengingat dikirim ke penerima yang belum konfirmasi";
    case "CONFIRMED":
      return "Penerima menekan tombol konfirmasi penerimaan";
    case "LINK_OPENED":
      return "Penerima membuka tautan surat untuk pertama kali";
    case "LINK_OPENED_REPEAT":
      return "Penerima membuka kembali tautan surat";
    case "PENERIMA_CREATED":
    case "PENERIMA_UPDATED":
      return data.nama ? `Penerima: ${String(data.nama)}` : "Data penerima diperbarui";
    case "PENERIMA_DELETED":
      return "Penerima disembunyikan dari daftar aktif";
    case "ADMIN_LOGIN":
      return "Masuk ke panel admin";
    case "ADMIN_LOGOUT":
      return "Keluar dari panel admin";
    default:
      return "-";
  }
}
