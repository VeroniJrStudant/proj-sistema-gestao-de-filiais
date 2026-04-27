import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const prismaDir = path.join(repoRoot, "prisma");
const templateDbPath = path.join(prismaDir, "vercel-template.db");

function run(cmd: string) {
  execSync(cmd, {
    stdio: "inherit",
    env: {
      ...process.env,
      // Build-time DB used only to bake schema + seed into the template file.
      DATABASE_URL: `file:${templateDbPath}`,
    },
  });
}

fs.mkdirSync(prismaDir, { recursive: true });
try {
  fs.unlinkSync(templateDbPath);
} catch {
  // ignore
}

// For an ephemeral SQLite template used only on Vercel, we prefer `db push`
// to guarantee the database schema matches the current Prisma schema,
// even if migrations are not fully in sync.
run("npx prisma db push --force-reset");
run("npx tsx prisma/seed.ts");

