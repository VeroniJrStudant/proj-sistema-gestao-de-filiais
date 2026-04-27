/** Converte texto em pt-BR (ex.: "3.500,50" ou "3500,5") para centavos. Vazio → null. */
export function parseBrlStringToCents(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const normalized = t.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999.99) return null;
  return Math.round(n * 100);
}

/** Centavos → string para input (ex.: "3.500,50"). */
export function centsToBrlInput(cents: number | null | undefined): string {
  if (cents == null || cents < 0 || !Number.isFinite(cents)) return "";
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
