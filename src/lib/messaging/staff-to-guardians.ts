import { getSession } from "@/lib/auth/session";
import { sendAgendaMessageEmail } from "@/lib/email/send-agenda-message";
import {
  StudentMessageDeliveryStatus,
  StudentMessageDirection,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink } from "@/lib/whatsapp";

function uniqStrings(xs: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const x of xs) {
    const t = x?.trim();
    if (!t) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

export type StaffToGuardiansSendResult =
  | {
      ok: true;
      emailed: boolean;
      emailReason?: "smtp_missing" | "send_failed" | "no_recipients";
      toEmails: string[];
      whatsappLinks: string[];
    }
  | { ok: false; error: string };

/**
 * Professor(a) / admin: envia recado aos responsáveis (e-mail + links WhatsApp) e grava em `StudentMessage`.
 */
export async function sendStaffMessageToGuardians(params: {
  studentId: string;
  message: string;
  /** Título curto no texto do WhatsApp (ex.: "Comunicado escolar", "Presença e portaria"). */
  channelLabel?: string;
  /** Quando informado (ADMIN), envia apenas para estes responsáveis. */
  guardianIds?: string[];
}): Promise<StaffToGuardiansSendResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Sessão inválida. Faça login novamente." };

  const studentId = params.studentId.trim();
  const message = params.message.trim();
  const guardianIds = (params.guardianIds ?? []).map((x) => x.trim()).filter(Boolean);
  if (!studentId) return { ok: false, error: "Aluno inválido." };
  if (message.length < 2) return { ok: false, error: "Digite uma mensagem." };
  if (message.length > 2000) return { ok: false, error: "Mensagem muito longa (máx. 2000 caracteres)." };

  if (session.role !== "ADMIN" && session.role !== "TEACHER") {
    return { ok: false, error: "Seu perfil não tem permissão para enviar mensagens." };
  }

  if (params.guardianIds !== undefined && session.role !== "ADMIN") {
    return { ok: false, error: "Apenas administradores podem selecionar responsáveis para envio." };
  }
  if (params.guardianIds !== undefined && guardianIds.length === 0) {
    return { ok: false, error: "Selecione ao menos um responsável para envio." };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      guardians: {
        select: {
          guardianId: true,
          guardian: { select: { name: true, phone: true, email: true } },
        },
      },
    },
  });

  if (!student) return { ok: false, error: "Aluno não encontrado." };

  const selectedGuardians =
    params.guardianIds !== undefined
      ? student.guardians.filter((g) => guardianIds.includes(g.guardianId))
      : student.guardians;

  const toEmails = uniqStrings(selectedGuardians.map((g) => g.guardian.email));
  const toPhones = uniqStrings(selectedGuardians.map((g) => g.guardian.phone));

  const authorLabel = session.displayName?.trim() || session.email;

  const emailResult = await sendAgendaMessageEmail({
    to: toEmails,
    studentName: student.name.trim(),
    authorLabel,
    message,
  });

  const heading = (params.channelLabel ?? "Comunicado escolar").trim();
  const whatsappLinks = uniqStrings(
    toPhones.map((p) =>
      buildWhatsAppLink({
        phone: p,
        text: `${heading} — ${student.name.trim()}\n\n${message}`,
      }),
    ),
  );

  const deliveryStatus = emailResult.ok
    ? StudentMessageDeliveryStatus.SENT
    : toEmails.length > 0
      ? StudentMessageDeliveryStatus.FAILED
      : StudentMessageDeliveryStatus.QUEUED;

  await prisma.studentMessage.create({
    data: {
      studentId,
      body: message,
      authorLabel,
      direction: StudentMessageDirection.SCHOOL_TO_FAMILY,
      toEmailsJson: JSON.stringify(toEmails),
      toPhonesJson: JSON.stringify(toPhones),
      deliveryStatus,
      deliveryDetailsJson: emailResult.ok
        ? null
        : JSON.stringify({ reason: emailResult.reason, channel: "email" }),
    },
  });

  return {
    ok: true,
    emailed: emailResult.ok,
    emailReason: emailResult.ok ? undefined : emailResult.reason,
    toEmails,
    whatsappLinks,
  };
}
