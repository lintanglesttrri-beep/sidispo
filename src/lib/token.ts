import crypto from "node:crypto";
import { getAppUrl, getTokenTtlDays } from "@/lib/env";

/**
 * Generates a cryptographically strong random token (256 bits of entropy, base64url).
 * Raw tokens MUST NEVER be stored in the database or written to logs.
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Hashes a raw token using SHA-256 for storage and constant-length DB lookup.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/**
 * Basic format guard before hashing/querying to reject malformed tokens early.
 */
export function isValidTokenFormat(rawToken: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(rawToken);
}

export function computeTokenExpiry(days?: number, baseDate?: Date): Date {
  const ttl = days ?? getTokenTtlDays();
  const base = baseDate ? new Date(baseDate) : new Date();
  base.setDate(base.getDate() + ttl);
  return base;
}

export function buildDispositionUrl(rawToken: string): string {
  return `${getAppUrl()}/d/${encodeURIComponent(rawToken)}`;
}
