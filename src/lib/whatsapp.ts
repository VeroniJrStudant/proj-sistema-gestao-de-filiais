export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Gera link wa.me. Se não houver DDI, assume Brasil (55).
 * Aceita telefone com máscara (ex.: (11) 99999-9999).
 */
export function buildWhatsAppLink(params: { phone: string; text: string }): string | null {
  const digits = normalizePhoneDigits(params.phone);
  if (!digits) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  const text = params.text.trim();
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${withCountry}${q}`;
}

