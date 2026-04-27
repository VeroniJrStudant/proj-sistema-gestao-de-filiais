import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function createPasswordResetRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashPasswordResetToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
