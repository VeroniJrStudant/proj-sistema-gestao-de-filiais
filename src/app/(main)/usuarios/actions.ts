"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { UserProfileRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizeLoginName } from "@/lib/auth/identifier";
import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  sanitizePermissionsForRole,
  type PermissionId,
} from "@/lib/auth/permissions";
import { generateTotpSecret, otpAuthUrl } from "@/lib/auth/totp";
import { sendPasswordResetLinkForUserId } from "@/lib/auth/password-reset-flow";
import { ActivityAction } from "@/lib/audit/activity-actions";
import { logUserActivity } from "@/lib/audit/log-activity";

export type CreateUserResult =
  | { ok: true; twoFactor?: { secret: string; otpauthUrl: string } }
  | { ok: false; error: string }
  | null;

const ROLE_VALUES = new Set<string>(Object.values(UserProfileRole));

function parseRole(raw: string): UserProfileRole | null {
  if (!ROLE_VALUES.has(raw)) {
    return null;
  }
  return raw as UserProfileRole;
}

export async function createUserAccount(_prev: CreateUserResult, formData: FormData): Promise<CreateUserResult> {
  const session = await getSession();
  const total = await prisma.userAccount.count();
  if (total === 0) {
    return { ok: false, error: "Use a página de primeiro acesso para criar o administrador inicial." };
  }
  if (!session?.permissions.includes("users.manage")) {
    return { ok: false, error: "Você não tem permissão para gerenciar usuários." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const loginName = normalizeLoginName(String(formData.get("loginName") ?? ""));
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const document = String(formData.get("document") ?? "").trim();
  const role = parseRole(String(formData.get("profileRole") ?? ""));
  const enable2fa = formData.get("enable2fa") === "on";
  const selected = formData.getAll("permissions").map(String) as PermissionId[];

  if (!role) {
    return { ok: false, error: "Selecione um perfil válido." };
  }
  if (displayName.length < 2) {
    return { ok: false, error: "Informe um nome de exibição válido." };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (loginName.length < 3) {
    return { ok: false, error: "O nome de usuário deve ter ao menos 3 caracteres." };
  }
  if (password.length < 8) {
    return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };
  }
  if (password !== password2) {
    return { ok: false, error: "As senhas não conferem." };
  }

  const sanitized = sanitizePermissionsForRole(role, selected.length ? selected : [...DEFAULT_PERMISSIONS_BY_ROLE[role]]);
  if (sanitized.length === 0) {
    return { ok: false, error: "Selecione ao menos uma permissão compatível com o perfil." };
  }

  let secret: string | undefined;
  if (enable2fa) {
    secret = generateTotpSecret();
  }

  let newUserId: string;
  try {
    const created = await prisma.userAccount.create({
      data: {
        displayName,
        email,
        loginName,
        phone: phone || null,
        document: document || null,
        active: true,
        passwordHash: await hashPassword(password),
        profileRole: role,
        permissionsJson: JSON.stringify(sanitized),
        twoFactorEnabled: enable2fa,
        twoFactorSecret: secret ?? null,
      },
      select: { id: true },
    });
    newUserId = created.id;
  } catch {
    return { ok: false, error: "Não foi possível salvar. E-mail ou usuário podem já existir." };
  }

  logUserActivity({
    actorUserId: session.sub,
    action: ActivityAction.USER_CREATED,
    details: {
      targetUserId: newUserId,
      displayName,
      email,
      profileRole: role,
      twoFactor: enable2fa,
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/usuarios/atividade");

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

  return { ok: true };
}

export type UpdateUserResult = { ok: true } | { ok: false; error: string } | null;

export async function updateUserAccount(_prev: UpdateUserResult, formData: FormData): Promise<UpdateUserResult> {
  const session = await getSession();
  if (!session?.permissions.includes("users.manage")) {
    return { ok: false, error: "Você não tem permissão para gerenciar usuários." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return { ok: false, error: "Usuário não informado." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const loginName = normalizeLoginName(String(formData.get("loginName") ?? ""));
  const phone = String(formData.get("phone") ?? "").trim();
  const document = String(formData.get("document") ?? "").trim();
  const role = parseRole(String(formData.get("profileRole") ?? ""));
  const selected = formData.getAll("permissions").map(String) as PermissionId[];

  if (!role) {
    return { ok: false, error: "Selecione um perfil válido." };
  }
  if (displayName.length < 2) {
    return { ok: false, error: "Informe um nome de exibição válido." };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (loginName.length < 3) {
    return { ok: false, error: "O nome de usuário deve ter ao menos 3 caracteres." };
  }

  const sanitized = sanitizePermissionsForRole(
    role,
    selected.length ? selected : [...DEFAULT_PERMISSIONS_BY_ROLE[role]],
  );
  if (sanitized.length === 0) {
    return { ok: false, error: "Selecione ao menos uma permissão compatível com o perfil." };
  }

  if (userId === session.sub && !sanitized.includes("users.manage")) {
    return {
      ok: false,
      error: "Você não pode remover a permissão «Usuários e permissões» da própria conta.",
    };
  }

  const exists = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) {
    return { ok: false, error: "Usuário não encontrado." };
  }

  try {
    await prisma.userAccount.update({
      where: { id: userId },
      data: {
        displayName,
        email,
        loginName,
        phone: phone || null,
        document: document || null,
        profileRole: role,
        permissionsJson: JSON.stringify(sanitized),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "E-mail ou nome de usuário já está em uso por outra conta." };
    }
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }

  logUserActivity({
    actorUserId: session.sub,
    action: ActivityAction.USER_UPDATED,
    details: {
      targetUserId: userId,
      displayName,
      email,
      profileRole: role,
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/usuarios/atividade");
  return { ok: true };
}

export type UserAdminActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function sendUserPasswordResetEmail(userId: string): Promise<UserAdminActionResult> {
  const session = await getSession();
  if (!session?.permissions.includes("users.manage")) {
    return { ok: false, error: "Sem permissão para gerenciar usuários." };
  }
  const target = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const result = await sendPasswordResetLinkForUserId(userId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  logUserActivity({
    actorUserId: session.sub,
    action: ActivityAction.USER_ADMIN_PASSWORD_RESET_SENT,
    details: { targetUserId: userId, targetEmail: target?.email ?? "" },
  });
  revalidatePath("/usuarios");
  revalidatePath("/usuarios/atividade");
  return { ok: true, message: "Link de redefinição enviado ao e-mail do usuário." };
}

export async function setUserAccountActive(userId: string, active: boolean): Promise<UserAdminActionResult> {
  const session = await getSession();
  if (!session?.permissions.includes("users.manage")) {
    return { ok: false, error: "Sem permissão para gerenciar usuários." };
  }
  if (userId === session.sub && !active) {
    return { ok: false, error: "Você não pode inativar a própria conta." };
  }
  const exists = await prisma.userAccount.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) {
    return { ok: false, error: "Usuário não encontrado." };
  }
  await prisma.userAccount.update({
    where: { id: userId },
    data: { active },
  });
  logUserActivity({
    actorUserId: session.sub,
    action: active ? ActivityAction.USER_ACTIVATED : ActivityAction.USER_DEACTIVATED,
    details: { targetUserId: userId },
  });
  revalidatePath("/usuarios");
  revalidatePath("/usuarios/atividade");
  return { ok: true, message: active ? "Conta ativada." : "Conta inativada." };
}
