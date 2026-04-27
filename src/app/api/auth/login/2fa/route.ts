import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPending2FAToken, signSessionToken } from "@/lib/auth/jwt";
import { verifyTotp } from "@/lib/auth/totp";
import { resolveStoredPermissions } from "@/lib/auth/permissions";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { sessionCookieOptions, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";
import { getRequestIp } from "@/lib/audit/request-ip";

export const runtime = "nodejs";

type Body = {
  pendingToken?: string;
  code?: string;
};

export async function POST(req: Request) {
  const ip = getRequestIp(req);
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const pendingToken = typeof body.pendingToken === "string" ? body.pendingToken : "";
  const code = typeof body.code === "string" ? body.code : "";
  if (!pendingToken || !code.trim()) {
    return NextResponse.json({ error: "Token ou código ausente." }, { status: 400 });
  }

  const userId = await verifyPending2FAToken(pendingToken);
  if (!userId) {
    return NextResponse.json({ error: "Sessão de verificação expirada. Entre novamente." }, { status: 401 });
  }

  const user = await prisma.userAccount.findUnique({ where: { id: userId } });
  if (!user?.active) {
    return NextResponse.json(
      { error: "Esta conta está desativada. Procure o administrador da unidade." },
      { status: 403 },
    );
  }
  if (!user.twoFactorSecret || !user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA não está configurada para esta conta." }, { status: 400 });
  }

  if (!verifyTotp(user.twoFactorSecret, code)) {
    logUserActivity({
      actorUserId: user.id,
      action: ActivityAction.AUTH_LOGIN_FAILED,
      details: { reason: "invalid_2fa_code" },
      ip,
    });
    return NextResponse.json({ error: "Código inválido." }, { status: 401 });
  }

  const permissions = resolveStoredPermissions(user.profileRole, user.permissionsJson);
  const token = await signSessionToken(
    {
      sub: user.id,
      email: user.email,
      loginName: user.loginName,
      displayName: user.displayName,
      role: user.profileRole,
      permissions,
    },
    SESSION_MAX_AGE_SECONDS,
  );

  logUserActivity({
    actorUserId: user.id,
    action: ActivityAction.AUTH_LOGIN_2FA_SUCCESS,
    ip,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
  return res;
}
