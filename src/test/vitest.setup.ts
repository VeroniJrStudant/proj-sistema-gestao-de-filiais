import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/** Evita atribuir a `process.env.NODE_ENV` (tipos read-only no `tsc` do Next). O Vitest já define `NODE_ENV`. */
if (!process.env.AUTH_SECRET) {
  Object.assign(process.env, { AUTH_SECRET: "test-auth-secret-32-chars-minimum!!" });
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

