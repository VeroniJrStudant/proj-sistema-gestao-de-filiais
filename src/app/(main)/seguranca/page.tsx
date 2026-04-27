import Link from "next/link";

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm transition hover:border-accent-border hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink group-hover:text-accent">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full border border-line-soft bg-shell px-2.5 py-1 text-xs font-semibold text-muted group-hover:border-accent-border group-hover:text-ink">
          Abrir
        </span>
      </div>
    </Link>
  );
}

export default function SegurancaPage() {
  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6">
      <header className="rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Monitoramento</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Segurança</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Acompanhamento de atividades e pontos de câmera cadastrados.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Atalhos de segurança">
        <Card title="Atividades" description="Log e histórico de atividade de usuários no sistema." href="/usuarios/atividade" />
        <Card title="Câmeras de segurança" description="Cadastro de câmeras, pontos e links de visualização." href="/cameras" />
      </section>
    </div>
  );
}

