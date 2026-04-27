"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserProfileRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizeLoginName } from "@/lib/auth/identifier";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_PERMISSIONS_BY_ROLE, sanitizePermissionsForRole } from "@/lib/auth/permissions";
import { generateTotpSecret, otpAuthUrl } from "@/lib/auth/totp";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";

export type BootstrapResult =
  | { ok: true; twoFactor?: { secret: string; otpauthUrl: string } }
  | { ok: false; error: string }
  | null;

export async function bootstrapFirstAdmin(
  _prev: BootstrapResult,
  formData: FormData,
): Promise<BootstrapResult> {
  if ((await prisma.userAccount.count()) > 0) {
    return { ok: false, error: "O primeiro administrador já foi criado. Acesse o login." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const loginName = normalizeLoginName(String(formData.get("loginName") ?? ""));
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const enable2fa = formData.get("enable2fa") === "on";

  if (displayName.length < 2) {
    return { ok: false, error: "Informe um nome de exibição válido." };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (loginName.length < 3) {
    return { ok: false, error: "O nome de usuário deve ter ao menos 3 caracteres (letras, números, ponto ou traço)." };
  }
  if (password.length < 8) {
    return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };
  }
  if (password !== password2) {
    return { ok: false, error: "As senhas não conferem." };
  }

  const perms = sanitizePermissionsForRole(UserProfileRole.ADMIN, [...DEFAULT_PERMISSIONS_BY_ROLE.ADMIN]);
  let secret: string | undefined;
  if (enable2fa) {
    secret = generateTotpSecret();
  }

  try {
    const row = await prisma.userAccount.create({
      data: {
        displayName,
        email,
        loginName,
        passwordHash: await hashPassword(password),
        profileRole: UserProfileRole.ADMIN,
        permissionsJson: JSON.stringify(perms),
        twoFactorEnabled: enable2fa,
        twoFactorSecret: secret ?? null,
      },
      select: { id: true },
    });
    logUserActivity({
      action: ActivityAction.USER_FIRST_ADMIN_CREATED,
      details: { targetUserId: row.id, displayName, email, twoFactor: enable2fa },
    });
    revalidatePath("/usuarios/atividade");
  } catch {
    return { ok: false, error: "Não foi possível salvar. Verifique se e-mail e usuário já existem." };
  }

  if (enable2fa && secret) {
    return {
      ok: true,
      twoFactor: {
        secret,
        otpauthUrl: otpAuthUrl({
          secret,
          email,
          issuer: "Creche Gestão",
        }),
      },
    };
  }

  redirect("/login?criado=1");
}
