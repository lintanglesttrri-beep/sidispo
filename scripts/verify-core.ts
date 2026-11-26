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
  createAdminAccountSchema,
  createSuratSchema,
  divisiSchema,
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
  assert.equal(isValidTokenFormat(t1), true);
  assert.equal(isValidTokenFormat("../../etc/passwd"), false);
  assert.equal(hashToken(t1).length, 64);
  assert.equal(hashToken(t1), hashToken(t1));

  // 2. Token expiry calculation
  const base = new Date("2026-11-22T00:00:00Z");
  const exp = computeTokenExpiry(30, base);
  assert.equal(exp.toISOString().slice(0, 10), "2026-12-22");

  // 3. Per-division Kode Arsip formatting
  assert.equal(formatKodeArsip("INK", "2026", 1), "STP/INK/2026/0001");
  assert.equal(formatKodeArsip("sek", "2026", 42), "STP/SEK/2026/0042");

  // 4. Divisi validation
  const validDiv = divisiSchema.safeParse({
    nama: "Inkubasi & Akselerasi",
    kode: "ink",
    kontakNama: "Admin Inkubasi",
    kontakWa: "0812-3456-7890",
    isActive: true,
  });
  assert.equal(validDiv.success, true);
  if (validDiv.success) {
    assert.equal(validDiv.data.kode, "INK");
    assert.equal(validDiv.data.kontakWa, "6281234567890");
  }

  // 5. Admin account validation (ADMIN_DIVISI requires divisiId)
  const missingDiv = createAdminAccountSchema.safeParse({
    nama: "Admin A",
    email: "a@stp.id",
    role: "ADMIN_DIVISI",
    divisiId: "",
    mode: "password",
    password: "password123",
  });
  assert.equal(missingDiv.success, false);

  // 6. Penerima validation requires valid divisiId UUID
  assert.equal(normalizeIndonesianWa("0812-3456-7890"), "6281234567890");
  const validPenerima = penerimaSchema.safeParse({
    nama: "Budi Santoso",
    jabatan: "Kepala Divisi",
    divisiId: "550e8400-e29b-41d4-a716-446655440000",
    noWa: "081234567890",
    isActive: true,
  });
  assert.equal(validPenerima.success, true);

  // 7. Surat validation requires divisiId & >= 1 recipient
  const invalidSurat = createSuratSchema.safeParse({
    divisiId: "550e8400-e29b-41d4-a716-446655440000",
    perihal: "Undangan",
    pengirim: "Pemkot",
    penerimaIds: [],
  });
  assert.equal(invalidSurat.success, false);

  // 8. Extend token bounds & rate limiter & WA builder
  assert.equal(
    extendTokenSchema.safeParse({ disposisiId: "abc", extraDays: 14 }).success,
    true
  );
  const key = "test:login:127.0.0.1";
  resetRateLimit(key);
  for (let i = 0; i < 5; i++) {
    assert.equal(checkRateLimit(key, 5, 60_000).allowed, true);
  }
  assert.equal(checkRateLimit(key, 5, 60_000).allowed, false);
  resetRateLimit(key);

  const msg = buildDispositionMessage({
    namaPenerima: "Budi Santoso",
    kodeArsip: "STP/INK/2026/0001",
    perihal: "Rapat Koordinasi",
    pengirim: "Dinas Perindustrian",
    isSegera: true,
    catatan: "Mohon hadir",
    linkUrl: "https://sidispo.vercel.app/d/sampletoken",
    expiresAt: exp,
  });
  assert.ok(msg.includes("[SEGERA]"));
  assert.ok(msg.includes("STP/INK/2026/0001"));
  assert.ok(buildWaMeUrl("6281234567890", msg).startsWith("https://wa.me/"));
  assert.ok(
    buildReminderMessage({
      namaPenerima: "Budi",
      kodeArsip: "STP/INK/2026/0001",
      perihal: "Rapat",
      expiresAt: exp,
    }).includes("[PENGINGAT]")
  );

  console.log("ALL CORE MULTI-DIVISION VERIFICATION TESTS PASSED (8/8)");
}

runTests();
