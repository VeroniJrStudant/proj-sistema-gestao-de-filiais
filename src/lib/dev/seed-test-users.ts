import type { UserProfileRole } from "@/generated/prisma/client";

export type SeedTestUserDef = {
  email: string;
  loginName: string;
  displayName: string;
  role: UserProfileRole;
};

export const SEED_TEST_USER_DEFS: SeedTestUserDef[] = [
  {
    email: "admin@teste.local",
    loginName: "admin",
    displayName: "Admin (Teste)",
    role: "ADMIN",
  },
  {
    email: "professor@teste.local",
    loginName: "professor",
    displayName: "Professor (Teste)",
    role: "TEACHER",
  },
  {
    email: "aluno@teste.local",
    loginName: "aluno",
    displayName: "Aluno (Teste)",
    role: "STUDENT",
  },
  {
    email: "pai@teste.local",
    loginName: "pai",
    displayName: "Pai (Teste)",
    role: "PARENT",
  },
  {
    email: "mae@teste.local",
    loginName: "mae",
    displayName: "Mãe (Teste)",
    role: "PARENT",
  },
  {
    email: "responsavel@teste.local",
    loginName: "responsavel",
    displayName: "Responsável legal (Teste)",
    role: "LEGAL_GUARDIAN",
  },
];

