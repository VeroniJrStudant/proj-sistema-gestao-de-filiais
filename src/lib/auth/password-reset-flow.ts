import { prisma } from "@/lib/prisma";
import { createPasswordResetRawToken, hashPasswordResetToken } from "@/lib/auth/password-reset-token";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";

const RESET_TTL_MS = 60 * 60 * 1000;

export async function sendPasswordResetLinkForUserId(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, active: true },
  });

  if (!user) {
    return { ok: false, error: "Usuário não encontrado." };
  }
  if (!user.active) {
    return { ok: false, error: "Conta inativa. Ative o usuário antes de enviar o link de senha." };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const rawToken = createPasswordResetRawToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const base = getAppBaseUrl();
  const resetUrl = `${base}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;

  const sent = await sendPasswordResetEmail({
    to: user.email,
    displayName: user.displayName,
    resetUrl,
  });

  if (!sent.ok) {
    return {
      ok: false,
      error:
        sent.reason === "smtp_missing"
          ? "E-mail não configurado (SMTP). Em desenvolvimento, verifique o console do servidor."
          : "Falha ao enviar o e-mail. Tente novamente ou verifique o SMTP.",
    };
  }

  return { ok: true };
}
