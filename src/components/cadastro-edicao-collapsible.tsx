"use client";

import { type ReactNode, useState } from "react";

/** Estilo compacto de cadastro/edição reutilizável. */
export const cadastroEdicaoToggleBtnClass =
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-accent-border bg-accent-soft px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80";

type Props = {
  /** Sincronize com `key` ao mudar aluno/professor para resetar aberto/fechado. */
  initialOpen?: boolean;
  /** Modo controlado: `open` e `onOpenChange` substituem o estado interno. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideLabel?: string;
  showLabel?: string;
  heading?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CadastroEdicaoCollapsible({
  initialOpen = false,
  open: controlledOpen,
  onOpenChange,
  hideLabel = "Ocultar cadastro e edição",
  showLabel = "Cadastrar ou editar",
  heading,
  children,
  className = "",
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={`mt-8 ${className}`.trim()}>
      <div
        className={
          heading
            ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            : "flex justify-end"
        }
      >
        {heading ? <div className="min-w-0 flex-1">{heading}</div> : null}
        <button type="button" className={cadastroEdicaoToggleBtnClass} onClick={() => setOpen(!open)}>
          {open ? hideLabel : showLabel}
        </button>
      </div>
      {open ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
