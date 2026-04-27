/** Estado de configuração para checkout direto (serializável para o cliente). */
export type DirectIntegrationStatus = {
  paymentGatewayConfigured: boolean;
  paymentGatewaySummary: string;
  nfeConfigured: boolean;
  nfeSummary: string;
};
