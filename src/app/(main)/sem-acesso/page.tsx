import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SemAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string }>;
}) {
  const sp = await searchParams;
  const de = typeof sp.de === "string" ? sp.de : "";

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-warn-border bg-warn-bg p-8">
      <h1 className="text-lg font-semibold text-warn-text">Acesso não autorizado</h1>
      <p className="text-sm text-warn-muted">
        Sua conta não tem permissão para abrir esta área do sistema
        {de ? (
          <>
            {" "}
            (<code className="rounded bg-accent-soft px-1 py-0.5 text-xs text-ink">{de}</code>)
          </>
        ) : null}
        . Solicite ao administrador o ajuste do seu perfil em <strong>Usuários</strong>.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
