import { createSupabaseAdmin } from "@/lib/supabase/server";

export type AuditEventType =
  | "SURAT_CREATED"
  | "SURAT_UPDATED"
  | "SURAT_CANCELLED"
  | "WA_ATTEMPT"
  | "WA_MANUAL_OPENED"
  | "WA_MANUAL_MARKED_SENT"
  | "WA_RESENT"
  | "LINK_OPENED"
  | "LINK_OPENED_REPEAT"
  | "CONFIRMED"
  | "TOKEN_REVOKED"
  | "TOKEN_EXTENDED"
  | "TOKEN_REISSUED"
  | "REMINDER_SENT"
  | "PENERIMA_CREATED"
  | "PENERIMA_UPDATED"
  | "PENERIMA_DELETED"
  | "DIVISI_CREATED"
  | "DIVISI_UPDATED"
  | "ADMIN_ACCOUNT_CREATED"
  | "ADMIN_ACCOUNT_UPDATED"
  | "ADMIN_ACCOUNT_DEACTIVATED"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT";

export interface AuditEntryInput {
  actorId?: string | null;
  actorEmail?: string | null;
  divisiId?: string | null;
  suratId?: string | null;
  disposisiId?: string | null;
  eventType: AuditEventType;
  eventData?: Record<string, unknown>;
}

/**
 * Append-only audit logger. Never pass raw tokens, passwords, or secrets in eventData.
 */
export async function logAudit(entry: AuditEntryInput): Promise<void> {
  const db = createSupabaseAdmin();
  await db.from("audit_logs").insert({
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    divisi_id: entry.divisiId ?? null,
    surat_id: entry.suratId ?? null,
    disposisi_id: entry.disposisiId ?? null,
    event_type: entry.eventType,
    event_data: entry.eventData ?? null,
  });
}
