import assert from "node:assert/strict";
import { formatKodeArsip } from "../src/lib/arsip";
import { checkRateLimit, resetRateLimit } from "../src/lib/rate-limit";
import {
  computeTokenExpiry,
  generateRawToken,
  hashToken,
  isValidTokenFormat,
} from "../src/lib/token";
import {
  createSuratSchema,
  extendTokenSchema,
  normalizeIndonesianWa,
  penerimaSchema,
} from "../src/lib/validators";
import {
  buildDispositionMessage,
  buildReminderMessage,
  buildWaMeUrl,
} from "../src/lib/wa/provider";

function runTests() {
  // 1. Token entropy, format, and deterministic SHA-256 hash
  const t1 = generateRawToken();
  const t2 = generateRawToken();
  assert.notEqual(t1, t2, "Tokens must be unique");
  assert.equal(isValidTokenFormat(t1), true, "Generated token must pass format check");
  assert.equal(isValidTokenFormat("../../etc/passwd"), false, "Traversal must fail token format");
  assert.equal(hashToken(t1).length, 64, "SHA-256 hex digest must be 64 chars");
  assert.equal(hashToken(t1), hashToken(t1), "Hash must be deterministic");

  // 2. Token expiry calculation
  const base = new Date("2026-11-22T00:00:00Z");
  const exp = computeTokenExpiry(30, base);
  assert.equal(exp.toISOString().slice(0, 10), "2026-12-22");

  // 3. Kode Arsip formatting
  assert.equal(formatKodeArsip("2026", 1), "STP/DSP/2026/0001");
  assert.equal(formatKodeArsip("2026", 42), "STP/DSP/2026/0042");

  // 4. WhatsApp normalization & Penerima validation
  assert.equal(normalizeIndonesianWa("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeIndonesianWa("+62 812 3456 7890"), "6281234567890");
  const validPenerima = penerimaSchema.safeParse({
    nama: "Budi Santoso",
    jabatan: "Kepala Divisi",
    divisi: "Inkubasi",
    noWa: "081234567890",
    isActive: true,
  });
  assert.equal(validPenerima.success, true);
  if (validPenerima.success) {
    assert.equal(validPenerima.data.noWa, "6281234567890");
  }

  // 5. Surat validation requires >= 1 recipient
  const invalidSurat = createSuratSchema.safeParse({
    perihal: "Undangan",
    pengirim: "Pemkot",
    penerimaIds: [],
  });
  assert.equal(invalidSurat.success, false, "Must reject empty recipients");

  // 6. ADM-12 extend token bounds
  assert.equal(
    extendTokenSchema.safeParse({ disposisiId: "abc", extraDays: 14 }).success,
    true
  );
  assert.equal(
    extendTokenSchema.safeParse({ disposisiId: "abc", extraDays: 0 }).success,
    false
  );

  // 7. Rate limiter
  const key = "test:login:127.0.0.1";
  resetRateLimit(key);
  for (let i = 0; i < 5; i++) {
    assert.equal(checkRateLimit(key, 5, 60_000).allowed, true);
  }
  assert.equal(checkRateLimit(key, 5, 60_000).allowed, false);
  resetRateLimit(key);

  // 8. WhatsApp message & wa.me URL builder
  const msg = buildDispositionMessage({
    namaPenerima: "Budi Santoso",
    kodeArsip: "STP/DSP/2026/0001",
    perihal: "Rapat Koordinasi",
    pengirim: "Dinas Perindustrian",
    isSegera: true,
    catatan: "Mohon hadir",
    linkUrl: "https://sidispo.vercel.app/d/sampletoken",
    expiresAt: exp,
  });
  assert.ok(msg.includes("[SEGERA]"));
  assert.ok(msg.includes("STP/DSP/2026/0001"));
  const waUrl = buildWaMeUrl("6281234567890", msg);
  assert.ok(waUrl.startsWith("https://wa.me/6281234567890?text="));

  const remMsg = buildReminderMessage({
    namaPenerima: "Budi Santoso",
    kodeArsip: "STP/DSP/2026/0001",
    perihal: "Rapat Koordinasi",
    expiresAt: exp,
  });
  assert.ok(remMsg.includes("[PENGINGAT]"));

  console.log("ALL CORE VERIFICATION TESTS PASSED (8/8)");
}

runTests();
