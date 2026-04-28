"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base = "/financeiro/entradas";
const receb = `${base}/recebimento`;
const pais = `${base}/pagamentos-pais`;
const pix = `${base}/pix-impresso`;

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

export function EntradasSubnav() {
  const pathname = usePathname();
  if (!pathname.startsWith(base)) return null;

  return (
    <nav
      aria-label="Subpáginas de entradas"
      className="flex flex-wrap gap-2 border-b border-line-soft pb-3"
    >
      {pill(base, "Visão geral", pathname)}
      {pill(receb, "Mensalidades", pathname)}
      {pill(pais, "Pagamentos (famílias)", pathname)}
      {pill(pix, "PIX impresso", pathname)}
    </nav>
  );
}
