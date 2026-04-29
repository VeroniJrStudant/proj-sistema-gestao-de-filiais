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

export default function AdministracaoPage() {
  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6">
      <header className="rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Área administrativa</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Administração</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Cadastros principais e manutenção do sistema: pessoas, fornecedores, almoxarifado e usuários.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Atalhos de administração">
        <Card
          title="Funções e categorias"
          description="Cadastros auxiliares: funções e categorias para funcionários e fornecedores."
          href="/administracao/funcoes-e-categorias"
        />
        <Card title="Funcionários" description="Cadastro e edição de funcionários (código, contato, vínculo)." href="/funcionarios/novo" />
        <Card title="Fornecedores" description="Cadastro e edição de fornecedores (código, pagamento, endereço)." href="/fornecedores" />
        <Card
          title="Almoxarifado"
          description="Limpeza, material de escritório e zeladoria — um único painel com abas por setor."
          href="/estoque/almoxarifado"
        />
        <Card title="Usuários" description="Perfis de acesso, permissões e gerenciamento de contas." href="/usuarios" />
      </section>
    </div>
  );
}

