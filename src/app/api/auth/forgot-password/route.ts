import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeLoginIdentifier } from "@/lib/auth/identifier";
import { sendPasswordResetLinkForUserId } from "@/lib/auth/password-reset-flow";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";
import { getRequestIp, maskIdentifierHint } from "@/lib/audit/request-ip";

export const runtime = "nodejs";

const PUBLIC_MESSAGE =
  "Se existir uma conta para os dados informados, enviamos um e-mail com o link para redefinir a senha.";

type Body = {
  identifier?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const raw = typeof body.identifier === "string" ? body.identifier : "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "Informe o e-mail ou nome de usuário." }, { status: 400 });
  }

  const key = normalizeLoginIdentifier(raw);
  const ip = getRequestIp(req);
  const user = await prisma.userAccount.findFirst({
    where: { OR: [{ email: key }, { loginName: key }] },
    select: { id: true, active: true, email: true },
  });

  if (user?.active) {
    await sendPasswordResetLinkForUserId(user.id);
    logUserActivity({
      action: ActivityAction.AUTH_PASSWORD_RESET_REQUEST,
      details: { matched: true, targetUserId: user.id, targetEmail: user.email },
      ip,
    });
  } else {
    logUserActivity({
      action: ActivityAction.AUTH_PASSWORD_RESET_REQUEST,
      details: { matched: false, identifierHint: maskIdentifierHint(key) },
      ip,
    });
  }

  return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE });
}
