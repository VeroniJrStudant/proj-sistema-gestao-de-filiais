import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeLoginIdentifier } from "@/lib/auth/identifier";
import { verifyPassword } from "@/lib/auth/password";
import { signPending2FAToken, signSessionToken } from "@/lib/auth/jwt";
import { resolveStoredPermissions } from "@/lib/auth/permissions";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { sessionCookieOptions, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";
import { getRequestIp, maskIdentifierHint } from "@/lib/audit/request-ip";

export const runtime = "nodejs";

type Body = {
  identifier?: string;
  password?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const identifier = typeof body.identifier === "string" ? body.identifier : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier.trim() || !password) {
    return NextResponse.json({ error: "Informe e-mail ou usuário e a senha." }, { status: 400 });
  }

  const key = normalizeLoginIdentifier(identifier);
  const ip = getRequestIp(req);
  const user = await prisma.userAccount.findFirst({
    where: {
      OR: [{ email: key }, { loginName: key }],
    },
  });

  if (!user) {
    logUserActivity({
      action: ActivityAction.AUTH_LOGIN_FAILED,
      details: { step: "unknown_user", identifierHint: maskIdentifierHint(key) },
      ip,
    });
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  if (!user.active) {
    logUserActivity({
      actorUserId: user.id,
      action: ActivityAction.AUTH_LOGIN_INACTIVE,
      details: { loginName: user.loginName },
      ip,
    });
    return NextResponse.json(
      { error: "Esta conta está desativada. Procure o administrador da unidade." },
      { status: 403 },
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    logUserActivity({
      actorUserId: user.id,
      action: ActivityAction.AUTH_LOGIN_FAILED,
      details: { reason: "wrong_password" },
      ip,
    });
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  if (user.twoFactorEnabled && user.twoFactorSecret) {
    logUserActivity({
      actorUserId: user.id,
      action: ActivityAction.AUTH_LOGIN_2FA_PENDING,
      ip,
    });
    const pendingToken = await signPending2FAToken(user.id, 300);
    return NextResponse.json({
      needsTwoFactor: true,
      pendingToken,
    });
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
    action: ActivityAction.AUTH_LOGIN_SUCCESS,
    ip,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
  return res;
}
