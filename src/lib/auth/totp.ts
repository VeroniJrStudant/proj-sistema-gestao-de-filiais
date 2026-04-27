import { generateSecret, generateURI, verifySync } from "otplib";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function verifyTotp(secret: string, token: string): boolean {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(clean)) {
    return false;
  }
  const result = verifySync({
    secret,
    token: clean,
    epochTolerance: 30,
  });
  return result.valid;
}

export function otpAuthUrl(params: { secret: string; email: string; issuer: string }): string {
  return generateURI({
    issuer: params.issuer,
    label: params.email,
    secret: params.secret,
  });
}
