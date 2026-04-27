import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken, type SessionTokenPayload } from "@/lib/auth/jwt";
import type { PermissionId } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = SESSION_COOKIE_NAME;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function getSession(): Promise<SessionTokenPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }
  const payload = await verifySessionToken(raw);
  if (!payload) {
    return null;
  }
  const user = await prisma.userAccount.findUnique({
    where: { id: payload.sub },
    select: { active: true },
  });
  if (!user?.active) {
    redirect("/api/auth/clear-session");
  }
  return payload;
}

export async function requirePermission(permission: PermissionId): Promise<SessionTokenPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (!session.permissions.includes(permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
