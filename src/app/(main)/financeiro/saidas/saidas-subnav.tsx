"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base = "/financeiro/saidas";
const lote = `${base}/lancamentos-lote`;

function pill(href: string, label: string, pathname: string) {
  const active =
    href === base
      ? pathname === base || pathname === `${base}/`
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-accent-border bg-accent text-on-accent"
          : "border-line bg-elevated text-muted hover:border-accent-border/60 hover:bg-elevated-2 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export function SaidasSubnav() {
  const pathname = usePathname();
  if (!pathname.startsWith(base)) return null;

  return (
    <nav aria-label="Subpáginas de saídas" className="flex flex-wrap gap-2 border-b border-line-soft pb-3">
      {pill(base, "Visão geral", pathname)}
      {pill(lote, "Lançamentos em lote", pathname)}
    </nav>
  );
}
