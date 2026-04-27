import { prisma } from "@/lib/prisma";

export type LogActivityInput = {
  actorUserId?: string | null;
  action: string;
  details?: Record<string, unknown>;
  ip?: string | null;
};

/**
 * Registro assíncrono e à prova de falhas: erros de auditoria não quebram o fluxo principal.
 */
export function logUserActivity(input: LogActivityInput): void {
  void (async () => {
    try {
      await prisma.userActivityLog.create({
        data: {
          actorUserId: input.actorUserId?.trim() || null,
          action: input.action,
          detailsJson: input.details ? JSON.stringify(input.details) : null,
          ip: input.ip?.trim() || null,
        },
      });
    } catch (err) {
      console.error("[audit] falha ao gravar log:", err);
    }
  })();
}
