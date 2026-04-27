"use client";

import { useEffect } from "react";

/** Aplica classe no `body` para esconder sidebar ao imprimir (ver `globals.css`). */
export function DebitDocPrintBodyClass({ className }: { className: string }) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
  return null;
}

export function PrintPageButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-lg border border-line bg-elevated-2 px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-line-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      Imprimir
    </button>
  );
}
