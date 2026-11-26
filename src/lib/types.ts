export type AdminRole = "SUPERADMIN" | "ADMIN_DIVISI";
export type DisposisiStatus = "BELUM_DIKONFIRMASI" | "SUDAH_DIKONFIRMASI";
export type WaStatus = "PENDING" | "SENT" | "FAILED" | "DIKIRIM_MANUAL";

export interface DivisiRow {
  id: string;
  nama: string;
  kode: string;
  kontak_nama: string;
  kontak_wa: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  nama: string;
  email: string;
  role: AdminRole;
  divisi_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PenerimaDbRow {
  id: string;
  nama: string;
  jabatan: string;
  divisi: string;
  divisi_id: string | null;
  no_wa: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuratDbRow {
  id: string;
  divisi_id: string;
  kode_arsip: string;
  perihal: string;
  pengirim: string;
  nomor_surat: string | null;
  file_path: string;
  file_name: string;
  file_mime: string;
  file_size: number;
  is_segera: boolean;
  batas_tindak_lanjut: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

export interface DisposisiDbRow {
  id: string;
  surat_id: string;
  penerima_id: string;
  catatan: string;
  token_hash: string;
  token_version: number;
  token_expires_at: string;
  revoked_at: string | null;
  wa_status: WaStatus;
  wa_sent_at: string | null;
  opened_at: string | null;
  confirmed_at: string | null;
  status: DisposisiStatus;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogDbRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  divisi_id: string | null;
  surat_id: string | null;
  disposisi_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}
