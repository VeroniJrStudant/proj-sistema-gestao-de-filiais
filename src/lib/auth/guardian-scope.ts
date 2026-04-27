import type { SessionTokenPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

/** Lista de alunos que o responsável enxerga (via `UserAccount.guardianId` + `StudentGuardian`). */
export async function getGuardianScopedStudentIds(
  session: SessionTokenPayload | null,
): Promise<string[] | null> {
  if (!session) return null;
  if (session.role !== "PARENT" && session.role !== "LEGAL_GUARDIAN") return null;

  const user = await prisma.userAccount.findUnique({
    where: { id: session.sub },
    select: { guardianId: true },
  });
  const gid = user?.guardianId?.trim();
  if (!gid) return [];

  const links = await prisma.studentGuardian.findMany({
    where: { guardianId: gid },
    select: { studentId: true },
  });
  return links.map((l) => l.studentId);
}
