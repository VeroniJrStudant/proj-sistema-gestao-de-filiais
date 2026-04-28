"use client";

import { useMemo, useState } from "react";

export type PaymentOption = { value: string; label: string };

export function PreferredPaymentSelector({
  name,
  options,
  defaultSelected,
  disabled,
}: {
  /** Nome do campo no FormData (múltiplos valores). */
  name: string;
  options: readonly PaymentOption[];
  defaultSelected: readonly string[];
  disabled?: boolean;
}) {
  const defaults = useMemo(() => new Set(defaultSelected.map((s) => s.trim()).filter(Boolean)), [defaultSelected]);
  const [selected, setSelected] = useState<Set<string>>(defaults);

  const selectedList = useMemo(() => {
    const out: string[] = [];
    for (const o of options) {
      if (selected.has(o.value)) out.push(o.value);
    }
    return out;
  }, [options, selected]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.has(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(o.value)) next.delete(o.value);
                  else next.add(o.value);
                  return next;
                });
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                on
                  ? "border-accent-border bg-accent text-on-accent"
                  : "border-line bg-shell text-muted hover:bg-elevated-2 hover:text-ink"
              } disabled:opacity-50`}
              title={o.label}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Persistência no submit: múltiplos inputs com o mesmo nome */}
      <div className="hidden" aria-hidden>
        {selectedList.map((v) => (
          <input key={v} type="hidden" name={name} value={v} />
        ))}
      </div>
    </div>
  );
}

