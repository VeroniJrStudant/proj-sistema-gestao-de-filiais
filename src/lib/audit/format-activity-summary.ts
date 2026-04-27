import { ActivityAction } from "@/lib/audit/activity-actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { UserProfileRole } from "@/generated/prisma/enums";

function parseDetails(json: string | null): Record<string, unknown> | null {
  if (!json?.trim()) return null;
  try {
    const v = JSON.parse(json) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function formatActivitySummary(action: string, detailsJson: string | null): string {
  const d = parseDetails(detailsJson);
  if (!d) {
    return "—";
  }

  switch (action) {
    case ActivityAction.AUTH_LOGIN_SUCCESS:
    case ActivityAction.AUTH_LOGIN_2FA_SUCCESS:
      return "Sessão iniciada com sucesso.";
    case ActivityAction.AUTH_LOGIN_FAILED:
      return String(d.reason ?? d.step ?? "Credenciais inválidas ou usuário inexistente.");
    case ActivityAction.AUTH_LOGIN_INACTIVE:
      return "Tentativa de acesso a conta desativada.";
    case ActivityAction.AUTH_LOGIN_2FA_PENDING:
      return "Senha válida; enviado desafio de segundo fator.";
    case ActivityAction.AUTH_LOGOUT:
      return "Sessão encerrada pelo usuário.";
    case ActivityAction.AUTH_PASSWORD_RESET_REQUEST:
      return d.matched === false
        ? "Identificador não encontrado (mensagem genérica ao solicitante)."
        : `E-mail de redefinição disparado para ${String(d.targetEmail ?? "?")}.`;
    case ActivityAction.AUTH_PASSWORD_RESET_COMPLETE:
      return "Nova senha definida via link seguro.";
    case ActivityAction.AUTH_SESSION_CLEARED_INACTIVE:
      return "Cookie de sessão removido após detecção de conta inativa.";
    case ActivityAction.USER_FIRST_ADMIN_CREATED:
      return `Administrador inicial: ${String(d.displayName ?? "?")} (${String(d.email ?? "")}).`;
    case ActivityAction.USER_CREATED: {
      const role = d.profileRole as UserProfileRole | undefined;
      const rolePt = role && role in ROLE_LABELS ? ROLE_LABELS[role] : String(d.profileRole ?? "");
      return `Nova conta: ${String(d.displayName ?? "?")} · ${String(d.email ?? "")} · perfil ${rolePt}.`;
    }
    case ActivityAction.USER_ACTIVATED:
      return `Conta ativada (usuário alvo: ${String(d.targetUserId ?? "?")}).`;
    case ActivityAction.USER_DEACTIVATED:
      return `Conta inativada (usuário alvo: ${String(d.targetUserId ?? "?")}).`;
    case ActivityAction.USER_ADMIN_PASSWORD_RESET_SENT:
      return `Administrador solicitou redefinição de senha para ${String(d.targetEmail ?? "?")}.`;
    case ActivityAction.USER_UPDATED: {
      const role = d.profileRole as UserProfileRole | undefined;
      const rolePt = role && role in ROLE_LABELS ? ROLE_LABELS[role] : String(d.profileRole ?? "");
      return `Conta atualizada: ${String(d.displayName ?? "?")} · ${String(d.email ?? "")} · perfil ${rolePt}.`;
    }
    default:
      return Object.entries(d)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(" · ");
  }
}
