import { getWaMode, type WaMode } from "@/lib/env";
import { formatTanggalIndo } from "@/lib/format";

export interface WaMessageContext {
  namaPenerima: string;
  kodeArsip: string;
  perihal: string;
  pengirim: string;
  isSegera: boolean;
  catatan: string;
  batasTindakLanjut?: Date | null;
  linkUrl: string;
  expiresAt: Date;
}

export interface WaSendResult {
  ok: boolean;
  mode: WaMode;
  provider: string;
  messageId: string | null;
  code: string;
  summary: string;
  waMeUrl: string;
}

export function buildDispositionMessage(ctx: WaMessageContext): string {
  const lines: string[] = [
    ctx.isSegera
      ? "*[SEGERA] Disposisi Surat Internal — Solo Techno Park*"
      : "*Disposisi Surat Internal — Solo Techno Park*",
    "",
    `Yth. ${ctx.namaPenerima},`,
    "Anda menerima disposisi surat baru dari Sekretariat Solo Techno Park:",
    "",
    `• *Kode Arsip:* ${ctx.kodeArsip}`,
    `• *Pengirim:* ${ctx.pengirim}`,
    `• *Perihal:* ${ctx.perihal}`,
  ];

  if (ctx.batasTindakLanjut) {
    lines.push(
      `• *Batas Tindak Lanjut:* ${formatTanggalIndo(ctx.batasTindakLanjut)}`
    );
  }

  if (ctx.catatan.trim()) {
    lines.push(`• *Instruksi/Catatan:* ${ctx.catatan.trim()}`);
  }

  lines.push(
    "",
    "Silakan buka tautan berikut untuk melihat salinan digital surat dan melakukan konfirmasi penerimaan:",
    ctx.linkUrl,
    "",
    `_Tautan berlaku hingga ${formatTanggalIndo(ctx.expiresAt)}. Mohon tidak meneruskan tautan ini kepada pihak yang tidak berwenang._`
  );

  return lines.join("\n");
}

export function buildReminderMessage(ctx: {
  namaPenerima: string;
  kodeArsip: string;
  perihal: string;
  expiresAt: Date;
  linkUrl?: string;
}): string {
  const lines: string[] = [
    "*[PENGINGAT] Konfirmasi Penerimaan Disposisi — Solo Techno Park*",
    "",
    `Yth. ${ctx.namaPenerima},`,
    `Disposisi surat berikut belum dikonfirmasi penerimaannya:`,
    "",
    `• *Kode Arsip:* ${ctx.kodeArsip}`,
    `• *Perihal:* ${ctx.perihal}`,
    `• *Masa Berlaku Tautan:* s.d. ${formatTanggalIndo(ctx.expiresAt)}`,
  ];

  if (ctx.linkUrl) {
    lines.push("", "Buka tautan berikut untuk konfirmasi:", ctx.linkUrl);
  } else {
    lines.push(
      "",
      "Mohon membuka kembali tautan disposisi yang sebelumnya dikirim untuk melakukan konfirmasi penerimaan, atau hubungi Sekretariat STP jika membutuhkan tautan baru."
    );
  }

  return lines.join("\n");
}

export function buildWaMeUrl(noWa: string, message: string): string {
  const cleanNumber = noWa.replace(/[^\d]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Adapter pattern: supports "manual" (wa.me, free & safe default),
 * "simulation" (dev dry-run), and "cloud_api" (official Meta WhatsApp Cloud API).
 */
export async function sendWhatsAppNotification(
  noWa: string,
  message: string
): Promise<WaSendResult> {
  const mode = getWaMode();
  const waMeUrl = buildWaMeUrl(noWa, message);

  if (mode === "manual") {
    return {
      ok: true,
      mode: "manual",
      provider: "wa.me-manual",
      messageId: null,
      code: "MANUAL_READY",
      summary: "Siap dikirim manual melalui tautan wa.me oleh admin.",
      waMeUrl,
    };
  }

  if (mode === "simulation") {
    return {
      ok: true,
      mode: "simulation",
      provider: "simulation",
      messageId: `sim_${Date.now()}`,
      code: "200",
      summary: "Simulasi pengiriman berhasil (tidak mengirim pesan sungguhan).",
      waMeUrl,
    };
  }

  // Official Meta WhatsApp Cloud API adapter
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return {
      ok: false,
      mode: "cloud_api",
      provider: "meta-cloud-api",
      messageId: null,
      code: "CONFIG_MISSING",
      summary:
        "Konfigurasi WHATSAPP_PHONE_NUMBER_ID atau WHATSAPP_ACCESS_TOKEN belum lengkap.",
      waMeUrl,
    };
  }

  try {
    const endpoint = `https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: noWa.replace(/[^\d]/g, ""),
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string; code?: number };
    };

    if (!res.ok) {
      return {
        ok: false,
        mode: "cloud_api",
        provider: "meta-cloud-api",
        messageId: null,
        code: String(data.error?.code ?? res.status),
        summary: data.error?.message || `HTTP ${res.status}`,
        waMeUrl,
      };
    }

    return {
      ok: true,
      mode: "cloud_api",
      provider: "meta-cloud-api",
      messageId: data.messages?.[0]?.id ?? null,
      code: String(res.status),
      summary: "Terkirim ke WhatsApp Cloud API.",
      waMeUrl,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "cloud_api",
      provider: "meta-cloud-api",
      messageId: null,
      code: "NETWORK_ERROR",
      summary:
        err instanceof Error ? err.message : "Gagal menghubungi gateway WhatsApp.",
      waMeUrl,
    };
  }
}
