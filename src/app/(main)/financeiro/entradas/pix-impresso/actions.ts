"use server";

import { parseMoneyInputToCents } from "@/lib/tuition/enrollment-finance";
import { getSchoolPixConfig } from "@/lib/pix/school-pix-config";
import QRCode from "qrcode";
import { payload } from "pix-payload";

export type PixPrintResult =
  | {
      ok: true;
      pixCopiaECola: string;
      qrDataUrl: string;
      txid: string;
      barcodeValue: string;
      amountLabel: string;
    }
  | { ok: false; error: string };

export async function buildPixPrintPayload(form: FormData): Promise<PixPrintResult> {
  const cfg = await getSchoolPixConfig();
  if (!cfg.pixKey) {
    return {
      ok: false,
      error:
        "Chave PIX da unidade não configurada. Informe em Financeiro → Dados da empresa ou defina SCHOOL_PIX_KEY no servidor (e-mail, CPF, CNPJ ou EVP).",
    };
  }

  const amountText = form.get("amount")?.toString() ?? "";
  const amountCents = parseMoneyInputToCents(amountText);
  if (amountCents == null || amountCents <= 0) {
    return { ok: false, error: "Informe um valor válido (ex.: 150,00)." };
  }

  const amountReais = amountCents / 100;
  const txid = `PIX${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase().slice(0, 25);

  try {
    const pixCopiaECola = payload({
      key: cfg.pixKey,
      name: cfg.merchantName,
      city: cfg.merchantCity,
      amount: amountReais,
      transactionId: txid,
    });

    const qrDataUrl = await QRCode.toDataURL(pixCopiaECola, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });

    const barcodeValue = txid.replace(/[^A-Z0-9]/gi, "").slice(0, 24) || String(amountCents);

    const amountLabel = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amountReais);

    return {
      ok: true,
      pixCopiaECola,
      qrDataUrl,
      txid,
      barcodeValue,
      amountLabel,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao montar o PIX.";
    return { ok: false, error: msg };
  }
}
