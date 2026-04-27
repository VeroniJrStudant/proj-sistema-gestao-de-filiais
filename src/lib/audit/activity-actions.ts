/** Códigos de evento gravados em `UserActivityLog.action`. */
export const ActivityAction = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_LOGIN_INACTIVE: "AUTH_LOGIN_INACTIVE",
  AUTH_LOGIN_2FA_PENDING: "AUTH_LOGIN_2FA_PENDING",
  AUTH_LOGIN_2FA_SUCCESS: "AUTH_LOGIN_2FA_SUCCESS",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  AUTH_PASSWORD_RESET_REQUEST: "AUTH_PASSWORD_RESET_REQUEST",
  AUTH_PASSWORD_RESET_COMPLETE: "AUTH_PASSWORD_RESET_COMPLETE",
  AUTH_SESSION_CLEARED_INACTIVE: "AUTH_SESSION_CLEARED_INACTIVE",
  USER_FIRST_ADMIN_CREATED: "USER_FIRST_ADMIN_CREATED",
  USER_CREATED: "USER_CREATED",
  USER_ACTIVATED: "USER_ACTIVATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_ADMIN_PASSWORD_RESET_SENT: "USER_ADMIN_PASSWORD_RESET_SENT",
  USER_UPDATED: "USER_UPDATED",
} as const;

export type ActivityActionCode = (typeof ActivityAction)[keyof typeof ActivityAction];

export const ACTIVITY_LABEL_PT: Record<string, string> = {
  [ActivityAction.AUTH_LOGIN_SUCCESS]: "Login concluído",
  [ActivityAction.AUTH_LOGIN_FAILED]: "Falha no login",
  [ActivityAction.AUTH_LOGIN_INACTIVE]: "Login recusado (conta inativa)",
  [ActivityAction.AUTH_LOGIN_2FA_PENDING]: "Login — aguardando 2FA",
  [ActivityAction.AUTH_LOGIN_2FA_SUCCESS]: "Login concluído (após 2FA)",
  [ActivityAction.AUTH_LOGOUT]: "Logout",
  [ActivityAction.AUTH_PASSWORD_RESET_REQUEST]: "Pedido de redefinição de senha",
  [ActivityAction.AUTH_PASSWORD_RESET_COMPLETE]: "Senha redefinida pelo link",
  [ActivityAction.AUTH_SESSION_CLEARED_INACTIVE]: "Sessão encerrada (conta inativa)",
  [ActivityAction.USER_FIRST_ADMIN_CREATED]: "Primeiro administrador criado",
  [ActivityAction.USER_CREATED]: "Usuário cadastrado",
  [ActivityAction.USER_ACTIVATED]: "Conta ativada",
  [ActivityAction.USER_DEACTIVATED]: "Conta inativada",
  [ActivityAction.USER_ADMIN_PASSWORD_RESET_SENT]: "Link de senha enviado (admin)",
  [ActivityAction.USER_UPDATED]: "Dados do usuário alterados",
};

export function activityLabel(action: string): string {
  return ACTIVITY_LABEL_PT[action] ?? action;
}

/** Opções para filtro no painel de atividade (valor = código do evento). */
export const ACTIVITY_TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os tipos" },
  ...Object.values(ActivityAction).map((code) => ({
    value: code,
    label: ACTIVITY_LABEL_PT[code] ?? code,
  })),
];
