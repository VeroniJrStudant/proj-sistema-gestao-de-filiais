/**
 * Chave PIX e identificação da recebedora para BR Code (copia e cola / QR).
 * Pode ser definida em CompanySettings (banco) ou em `SCHOOL_PIX_KEY` / nome e cidade no ambiente.
 */
import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

export async function getSchoolPixConfig(): Promise<{
  pixKey: string | null;
  merchantName: string;
  merchantCity: string;
}> {
  const row = await prisma.companySettings.findUnique({ where: { id: SETTINGS_ID } });
  const rawName =
    row?.tradeName?.trim() ||
    row?.legalName?.trim() ||
    process.env.SCHOOL_NAME?.trim() ||
    process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() ||
    "CRECHE";
  const rawCity = row?.city?.trim() || process.env.SCHOOL_CITY?.trim() || "SAO PAULO";
  const pixKey = row?.pixKey?.trim() || process.env.SCHOOL_PIX_KEY?.trim() || null;
  return {
    pixKey,
    merchantName: pixSafeMerchantName(rawName, 25),
    merchantCity: pixSafeCity(rawCity, 15),
  };
}

function pixSafeMerchantName(s: string, max: number): string {
  return (
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toUpperCase()
      .replace(/[^A-Z0-9 *]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max) || "CRECHE"
  );
}

function pixSafeCity(s: string, max: number): string {
  return (
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toUpperCase()
      .replace(/[^A-Z ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max) || "SAO PAULO"
  );
}

export async function hasSchoolPixKey(): Promise<boolean> {
  const cfg = await getSchoolPixConfig();
  return Boolean(cfg.pixKey);
}
