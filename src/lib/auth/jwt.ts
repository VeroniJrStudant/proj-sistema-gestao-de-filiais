import { SignJWT, jwtVerify } from "jose";
import type { UserProfileRole } from "@/generated/prisma/client";
import type { PermissionId } from "@/lib/auth/permissions";

const SESSION_TYP = "creche_session";
const PENDING_2FA_TYP = "creche_2fa_pending";

function getSecretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres em produção.");
    }
    return new TextEncoder().encode("dev-insecure-auth-secret-change-me!!");
  }
  return new TextEncoder().encode(raw);
}

export type SessionTokenPayload = {
  sub: string;
  email: string;
  loginName: string;
  displayName: string;
  role: UserProfileRole;
  permissions: PermissionId[];
};

function isUserProfileRole(value: unknown): value is UserProfileRole {
  return (
    value === "ADMIN" ||
    value === "TEACHER" ||
    value === "STUDENT" ||
    value === "PARENT" ||
    value === "LEGAL_GUARDIAN"
  );
}

export async function signSessionToken(payload: SessionTokenPayload, maxAgeSeconds: number): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({
    typ: SESSION_TYP,
    email: payload.email,
    loginName: payload.loginName,
    displayName: payload.displayName,
    role: payload.role,
    permissions: payload.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (payload.typ !== SESSION_TYP || typeof payload.sub !== "string") {
      return null;
    }
    const email = payload.email;
    const loginName = payload.loginName;
    const displayName = payload.displayName;
    const role = payload.role;
    const permissions = payload.permissions;
    if (
      typeof email !== "string" ||
      typeof loginName !== "string" ||
      typeof displayName !== "string" ||
      !isUserProfileRole(role)
    ) {
      return null;
    }
    if (!Array.isArray(permissions) || !permissions.every((p) => typeof p === "string")) {
      return null;
    }
    return {
      sub: payload.sub,
      email,
      loginName,
      displayName,
      role,
      permissions: permissions as PermissionId[],
    };
  } catch {
    return null;
  }
}

export async function signPending2FAToken(userId: string, maxAgeSeconds: number): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({ typ: PENDING_2FA_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(key);
}

export async function verifyPending2FAToken(token: string): Promise<string | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (payload.typ !== PENDING_2FA_TYP || typeof payload.sub !== "string") {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}
