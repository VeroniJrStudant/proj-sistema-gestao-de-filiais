/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AREA, regression } from "@/test/regression-hint";
import { ThemeToggle } from "./theme-toggle";

describe(`ThemeToggle (${AREA.themeToggle})`, () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-palette");
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-palette");
    localStorage.clear();
  });

  it("aplica tema escuro e persiste em localStorage", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle compact />);
    await user.click(screen.getByTitle("Tema escuro (paleta padrão)"));
    expect(document.documentElement.classList.contains("dark"), regression(AREA.themeToggle, "classe dark no html")).toBe(
      true,
    );
    expect(localStorage.getItem("creche-theme"), regression(AREA.themeToggle, "persistência creche-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-palette")).toBeNull();
  });

  it("aplica tema claro com paleta Cachoeira Park (data-palette park)", async () => {
    document.documentElement.classList.add("dark");
    const user = userEvent.setup();
    render(<ThemeToggle compact />);
    await user.click(screen.getByTitle(/Claro com cores Cachoeira Park/i));
    expect(document.documentElement.classList.contains("dark"), regression(AREA.themeToggle, "remove dark")).toBe(
      false,
    );
    expect(localStorage.getItem("creche-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-palette")).toBe("park");
    expect(localStorage.getItem("creche-palette")).toBe("park");
  });
});
