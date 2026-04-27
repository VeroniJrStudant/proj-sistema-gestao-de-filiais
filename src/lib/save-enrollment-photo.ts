import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/**
 * Grava imagem em `public/uploads/alunos/{studentId}/` e retorna URL pública (ex.: `/uploads/alunos/...`).
 */
export async function saveEnrollmentPhoto(
  studentId: string,
  file: File,
  basename: string,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 3 MB).");
  }
  const mime = file.type.trim().toLowerCase();
  if (!ALLOWED.has(mime)) {
    throw new Error("Use JPG, PNG ou WebP.");
  }
  const ext = extensionForMime(mime);
  const safeBase = basename.replace(/[^a-z0-9-_]/gi, "-").slice(0, 64) || "foto";
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = join(process.cwd(), "public", "uploads", "alunos", studentId);
  await mkdir(dir, { recursive: true });
  const filename = `${safeBase}.${ext}`;
  await writeFile(join(dir, filename), buf);
  return `/uploads/alunos/${studentId}/${filename}`;
}
