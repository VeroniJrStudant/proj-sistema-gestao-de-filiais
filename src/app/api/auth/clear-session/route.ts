import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/jwt";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE_NAME)?.value;
  const session = raw ? await verifySessionToken(raw) : null;
  if (session) {
    logUserActivity({
      actorUserId: session.sub,
      action: ActivityAction.AUTH_SESSION_CLEARED_INACTIVE,
    });
  }

  const url = new URL(request.url);
  const login = new URL("/login", url.origin);
  login.searchParams.set("inativo", "1");
  const res = NextResponse.redirect(login);
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
