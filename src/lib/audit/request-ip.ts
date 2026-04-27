export function getRequestIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return null;
}

/** Mascara identificador em logs (evita expor e-mail completo em falhas públicas). */
export function maskIdentifierHint(raw: string): string {
  const t = raw.trim();
  if (!t) return "(vazio)";
  if (t.includes("@")) {
    const [user, domain] = t.split("@");
    if (!domain) return "***";
    const u = user ?? "";
    const head = u.slice(0, 2);
    return `${head}***@${domain}`;
  }
  if (t.length <= 3) return "***";
  return `${t.slice(0, 2)}***${t.slice(-1)}`;
}
