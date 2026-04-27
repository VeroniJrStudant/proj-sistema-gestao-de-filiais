import "server-only";

import { TUITION_PAYMENT_OPTIONS } from "@/lib/tuition/tuition-payment-options";
import { prisma } from "@/lib/prisma";

/** Garante uma linha por código padrão de mensalidade (primeira carga do banco). */
export async function ensureAcceptedPaymentMethodsSeeded(): Promise<void> {
  const count = await prisma.acceptedSchoolPaymentMethod.count();
  if (count > 0) return;
  await prisma.$transaction(
    TUITION_PAYMENT_OPTIONS.map((opt, i) =>
      prisma.acceptedSchoolPaymentMethod.create({
        data: { code: opt.value, sortOrder: i, active: true },
      }),
    ),
  );
}
