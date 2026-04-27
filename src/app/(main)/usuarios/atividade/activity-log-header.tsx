export function ActivityLogHeader() {
  return (
    <header className="relative min-w-0 overflow-hidden rounded-2xl border border-line bg-elevated-2 px-4 py-5 shadow-sm sm:px-8 sm:py-8">
      <div className="w-full min-w-0 rounded-xl border border-accent-border/60 bg-accent-soft/50 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Monitoramento</p>
        <p className="mt-2 text-sm text-muted">
          Linha do tempo de ações de autenticação e de gestão de contas (quem fez, quando e resumo). Últimos eventos
          aparecem primeiro.
        </p>
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Atividade dos usuários</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Use busca, período e tipo de evento para localizar tentativas de login, logouts, redefinições de senha e alterações
        feitas por administradores. Exporte o recorte filtrado para Excel quando precisar arquivar.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <li className="rounded-full border border-line-soft bg-shell px-3 py-1">Eventos de login e 2FA</li>
        <li className="rounded-full border border-line-soft bg-shell px-3 py-1">Recuperação de senha</li>
        <li className="rounded-full border border-line-soft bg-shell px-3 py-1">Cadastro e ativar/inativar</li>
      </ul>
    </header>
  );
}
