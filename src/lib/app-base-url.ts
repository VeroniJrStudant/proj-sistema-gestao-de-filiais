/**
 * URL pública da aplicação para links em e-mail (redefinição de senha, etc.).
 * Defina `APP_BASE_URL` em produção (ex.: https://app.suaescola.com.br).
 */
export function getAppBaseUrl(): string {
  const explicit =
    process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
