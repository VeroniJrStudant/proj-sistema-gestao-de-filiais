import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token";
import { hashPassword } from "@/lib/auth/password";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";
import { getRequestIp } from "@/lib/audit/request-ip";

export const runtime = "nodejs";

type Body = {
  token?: string;
  password?: string;
};

export async function POST(req: Request) {
  const ip = getRequestIp(req);
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const rawToken = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!rawToken || rawToken.length < 20) {
    return NextResponse.json({ error: "Link inválido ou incompleto." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, active: true, email: true } } },
  });

  if (!record || record.usedAt) {
    return NextResponse.json(
      { error: "Este link expirou ou já foi utilizado. Solicite um novo e-mail de redefinição." },
      { status: 400 },
    );
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Este link expirou. Solicite um novo e-mail de redefinição." },
      { status: 400 },
    );
  }

  if (!record.user.active) {
    return NextResponse.json(
      { error: "Esta conta está desativada. Peça a um administrador para reativá-la antes de definir a senha." },
      { status: 400 },
    );
  }

  const newHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.userAccount.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    }),
  ]);

  logUserActivity({
    actorUserId: record.userId,
    action: ActivityAction.AUTH_PASSWORD_RESET_COMPLETE,
    details: { targetUserId: record.userId, targetEmail: record.user.email },
    ip,
  });

  return NextResponse.json({ ok: true, message: "Senha atualizada. Você já pode entrar." });
}
