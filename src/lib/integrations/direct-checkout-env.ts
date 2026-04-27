import "server-only";

import type { DirectIntegrationStatus } from "@/lib/integrations/direct-checkout-types";

export type { DirectIntegrationStatus };

/**
 * Variáveis sugeridas (documentação — não obrigatórias para registrar solicitação no sistema):
 * - PAYMENT_GATEWAY_PROVIDER (ex.: asaas, pagarme, mercadopago)
 * - PAYMENT_GATEWAY_API_KEY (segredo; só servidor)
 * - NFE_INTEGRATION_ENABLED=true
 * - NFE_PROVIDER (ex.: focus, enotas)
 * - NFE_CERTIFICATE_PATH ou armazenamento seguro do certificado A1
 */
export function getDirectIntegrationStatus(): DirectIntegrationStatus {
  const provider = process.env.PAYMENT_GATEWAY_PROVIDER?.trim();
  const apiKey = process.env.PAYMENT_GATEWAY_API_KEY?.trim();
  const paymentGatewayConfigured = Boolean(provider && apiKey);

  const nfeFlag = process.env.NFE_INTEGRATION_ENABLED?.trim().toLowerCase() === "true";
  const nfeProvider = process.env.NFE_PROVIDER?.trim();
  const nfeCert = process.env.NFE_CERTIFICATE_PATH?.trim();
  const nfeConfigured = nfeFlag && Boolean(nfeProvider && nfeCert);

  return {
    paymentGatewayConfigured,
    paymentGatewaySummary: paymentGatewayConfigured
      ? `Provedor de pagamento: ${provider}. Chave API configurada no servidor.`
      : "Sem PSP configurado. Defina PAYMENT_GATEWAY_PROVIDER e PAYMENT_GATEWAY_API_KEY no ambiente do servidor para emissão automática de boleto, cartão e PIX.",
    nfeConfigured,
    nfeSummary: nfeConfigured
      ? `NF-e: ${nfeProvider} com certificado referenciado.`
      : "Sem emissor fiscal configurado. Defina NFE_INTEGRATION_ENABLED=true, NFE_PROVIDER e NFE_CERTIFICATE_PATH (ou equivalente) para transmissão à SEFAZ.",
  };
}
