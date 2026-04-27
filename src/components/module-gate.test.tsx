/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AREA, regression } from "@/test/regression-hint";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/modules", () => ({
  isModuleEnabled: vi.fn(),
}));

import { isModuleEnabled } from "@/lib/modules";
import { ModuleGate } from "./module-gate";

describe(`ModuleGate (${AREA.moduleGate} + ${AREA.modulesLib})`, () => {
  beforeEach(() => {
    vi.mocked(isModuleEnabled).mockReset();
  });

  it("bloqueia módulo desabilitado e orienta NEXT_PUBLIC_ENABLED_MODULES", () => {
    vi.mocked(isModuleEnabled).mockReturnValue(false);
    render(
      <ModuleGate id="branches">
        <div data-testid="protected">conteúdo</div>
      </ModuleGate>,
    );
    expect(screen.queryByTestId("protected"), regression(AREA.moduleGate, "filhos não devem aparecer")).toBeNull();
    expect(
      screen.getByText(/plano atual/i),
      regression(AREA.moduleGate, "mensagem de bloqueio visível"),
    ).toBeVisible();
    expect(screen.getByText(/NEXT_PUBLIC_ENABLED_MODULES/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /voltar ao painel/i })).toHaveAttribute("href", "/");
  });

  it("renderiza filhos quando módulo habilitado", () => {
    vi.mocked(isModuleEnabled).mockReturnValue(true);
    render(
      <ModuleGate id="branches">
        <div data-testid="protected">ok</div>
      </ModuleGate>,
    );
    expect(screen.getByTestId("protected"), regression(AREA.moduleGate, "conteúdo liberado")).toHaveTextContent("ok");
  });
});
