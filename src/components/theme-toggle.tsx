"use client";

import { useState } from "react";

const STORAGE_THEME = "creche-theme";
const STORAGE_PALETTE = "creche-palette";

function readThemeFromDom(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Claro = sempre paleta Cachoeira Park; escuro = paleta padrão (sem `data-palette`). */
function syncPaletteWithTheme(mode: "light" | "dark") {
  const root = document.documentElement;
  if (mode === "dark") {
    root.removeAttribute("data-palette");
    try {
      localStorage.removeItem(STORAGE_PALETTE);
    } catch {
      /* ignore */
    }
  } else {
    root.setAttribute("data-palette", "park");
    try {
      localStorage.setItem(STORAGE_PALETTE, "park");
    } catch {
      /* ignore */
    }
  }
}

function applyTheme(mode: "light" | "dark") {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  syncPaletteWithTheme(mode);
  try {
    localStorage.setItem(STORAGE_THEME, mode);
  } catch {
    /* ignore */
  }
}

type ThemeToggleProps = {
  /** Cabeçalho da sidebar: só ícones, sem borda superior. */
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">(() => readThemeFromDom());

  const isDark = theme === "dark";

  const groupClass = compact
    ? "flex shrink-0 rounded-lg border border-line bg-elevated p-0.5"
    : "flex rounded-xl border border-line bg-elevated p-1";

  const btnBase = compact
    ? "flex items-center justify-center rounded-md p-1.5 transition"
    : "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition";

  const activeClass = "bg-accent-soft text-ink shadow-sm ring-1 ring-accent-border/60";
  const idleClass = "text-muted hover:bg-elevated-2 hover:text-ink";

  return (
    <div className={compact ? "" : "border-t border-line p-3"}>
      {!compact ? (
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Aparência</p>
      ) : null}
      <div
        className={groupClass}
        role="group"
        aria-label="Tema: cores Cachoeira Park (claro) ou escuro padrão"
      >
        <button
          type="button"
          title="Claro com cores Cachoeira Park (cachoeirapark.com.br)"
          onClick={() => {
            applyTheme("light");
            setTheme("light");
          }}
          className={`${btnBase} ${theme !== null && !isDark ? activeClass : idleClass}`}
          aria-pressed={theme !== null && !isDark}
        >
          <IconSun className="h-4 w-4 shrink-0" />
          {!compact ? "CP" : null}
        </button>
        <button
          type="button"
          title="Tema escuro (paleta padrão)"
          onClick={() => {
            applyTheme("dark");
            setTheme("dark");
          }}
          className={`${btnBase} ${theme !== null && isDark ? activeClass : idleClass}`}
          aria-pressed={theme !== null && isDark}
        >
          <IconMoon className="h-4 w-4 shrink-0" />
          {!compact ? "Escuro" : null}
        </button>
      </div>
    </div>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      />
    </svg>
  );
}
