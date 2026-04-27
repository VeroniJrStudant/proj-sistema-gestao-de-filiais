export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeLoginName(raw: string): string {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "-");
  return s.replace(/[^a-z0-9._-]/g, "");
}

export function normalizeLoginIdentifier(raw: string): string {
  const t = raw.trim();
  if (t.includes("@")) {
    return normalizeEmail(t);
  }
  return normalizeLoginName(t);
}
