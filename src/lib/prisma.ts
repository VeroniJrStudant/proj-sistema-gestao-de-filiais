import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import fs from "node:fs";
import path from "node:path";

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw) {
    // If DATABASE_URL points to a relative SQLite file, Vercel won't be able to create it
    // because the deployment filesystem is read-only. Redirect to /tmp.
    if (process.env.VERCEL && /^file:\.\.?\//.test(raw)) {
      return "file:/tmp/proj-sistema-gestao-filiais.db";
    }
    return raw;
  }

  // Vercel/serverless: project filesystem is read-only; /tmp is writable.
  if (process.env.VERCEL) {
    return "file:/tmp/proj-sistema-gestao-filiais.db";
  }
  return "file:./prisma/gestao-filiais-dev.db";
}

const databaseUrl = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  // If using SQLite file, ensure parent directory exists (mainly for /tmp on Vercel).
  const m = /^file:(.+)$/.exec(databaseUrl);
  if (m) {
    const filePath = m[1];
    const dir = path.dirname(filePath);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // best-effort; Prisma will surface a clear error if it cannot create/open the DB
    }

    // Vercel: initialize ephemeral /tmp DB from a template (created at build time)
    // so the schema exists on first request.
    if (process.env.VERCEL && filePath.startsWith("/tmp/") && !fs.existsSync(filePath)) {
      const templatePath = path.join(process.cwd(), "prisma", "vercel-template.db");
      if (fs.existsSync(templatePath)) {
        try {
          fs.copyFileSync(templatePath, filePath);
        } catch {
          // If copy fails, Prisma will throw on first query; keep best-effort.
        }
      }
    }
  }
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

/** Dev HMR keeps a global PrismaClient; after `prisma generate` adds models, the old instance has no new delegates. */
function clientMatchesGeneratedSchema(client: PrismaClient | undefined): boolean {
  const c = client as {
    teacher?: { findMany?: unknown };
    acceptedSchoolPaymentMethod?: { findMany?: unknown };
    userAccount?: { findMany?: unknown };
    passwordResetToken?: { findMany?: unknown };
    userActivityLog?: { findMany?: unknown };
    /** Salas físicas + vínculo em turmas — se faltar, o cliente está desatualizado (ex.: sem `include.physicalRoom`). */
    physicalRoom?: { findMany?: unknown };
    /** Multi-unidade e novos domínios (filiais / imóveis / estacionamentos). */
    branch?: { findMany?: unknown };
    property?: { findMany?: unknown };
    parkingFacility?: { findMany?: unknown };
    /** Registro de entrada/saída (imóveis / estacionamentos). */
    accessSession?: { findMany?: unknown };
    accessPricingPlan?: { findMany?: unknown };
    accessPaymentPart?: { findMany?: unknown };
    customer?: { findMany?: unknown };
  };
  return (
    !!client &&
    typeof c.teacher?.findMany === "function" &&
    typeof c.acceptedSchoolPaymentMethod?.findMany === "function" &&
    typeof c.userAccount?.findMany === "function" &&
    typeof c.passwordResetToken?.findMany === "function" &&
    typeof c.userActivityLog?.findMany === "function" &&
    typeof c.physicalRoom?.findMany === "function" &&
    typeof c.branch?.findMany === "function" &&
    typeof c.property?.findMany === "function" &&
    typeof c.parkingFacility?.findMany === "function" &&
    typeof c.accessSession?.findMany === "function" &&
    typeof c.accessPricingPlan?.findMany === "function" &&
    typeof c.accessPaymentPart?.findMany === "function" &&
    typeof c.customer?.findMany === "function"
  );
}

const cached = globalForPrisma.prisma;
const prisma =
  cached && clientMatchesGeneratedSchema(cached) ? cached : createClient();

if (process.env.NODE_ENV !== "production") {
  if (cached && cached !== prisma) {
    void cached.$disconnect().catch(() => {});
  }
  globalForPrisma.prisma = prisma;
}

export { prisma };
