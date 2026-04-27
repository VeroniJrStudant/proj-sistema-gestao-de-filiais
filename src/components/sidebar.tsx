"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { ModuleDefinition } from "@/lib/modules";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export function Sidebar({
  modules,
  sessionLabel,
  canManageUsers,
  canAccessSuppliers,
}: {
  modules: readonly ModuleDefinition[];
  sessionLabel: string | null;
  canManageUsers: boolean;
  canAccessSuppliers: boolean;
}) {
  const pathname = usePathname();
  const financeModule = modules.find((m) => m.id === "finance");
  const hasModule = (id: ModuleDefinition["id"]) => modules.some((m) => m.id === id);
  const branchesModule = modules.find((m) => m.id === "branches");
  const propertiesModule = modules.find((m) => m.id === "properties");
  const parkingModule = modules.find((m) => m.id === "parking");
  const leasesModule = modules.find((m) => m.id === "leases");

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel/90 backdrop-blur-sm">
      <div className="border-b border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <Link href="/" className="font-semibold tracking-tight text-accent">
              Sistema de<span className="text-muted"> Gestão</span>
            </Link>
            <p className="mt-1 text-xs text-muted">Painel modular</p>
          </div>
          <ThemeToggle compact />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <NavLink href="/" active={pathname === "/"}>
          Indicadores
        </NavLink>
        {financeModule ? (
          <FinanceNavGroup
            label={financeModule.label}
            baseHref={financeModule.href}
            pathname={pathname}
            canManageUsers={canManageUsers}
          />
        ) : null}
        {branchesModule || propertiesModule || parkingModule || leasesModule ? (
          <OpsNavGroup
            pathname={pathname}
            branchesHref={branchesModule?.href ?? "/filiais"}
            propertiesHref={propertiesModule?.href ?? "/imoveis"}
            parkingHref={parkingModule?.href ?? "/estacionamentos"}
            leasesHref={leasesModule?.href ?? "/locacoes"}
          />
        ) : null}
        <AdminNavGroup
          pathname={pathname}
          canAccessSuppliers={canAccessSuppliers}
          canManageUsers={canManageUsers}
        />
        <NavLink href="/mural" active={pathname === "/mural"}>
          Mural
        </NavLink>
        {hasModule("attendance") ? (
          <NavLink href="/presenca" active={pathname === "/presenca" || pathname.startsWith("/presenca/")}>
            Registro de entrada/saída
          </NavLink>
        ) : null}
        <SecurityNavGroup pathname={pathname} />
      </nav>
      <div className="border-t border-line p-2">
        {sessionLabel ? (
          <p className="mb-2 truncate px-3 text-xs text-subtle" title={sessionLabel}>
            {sessionLabel}
          </p>
        ) : null}
        <LogoutButton />
      </div>
    </aside>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-accent text-on-accent"
          : "text-ink hover:bg-elevated-2"
      }`}
    >
      {children}
    </Link>
  );
}

function FinanceNavGroup({
  label,
  baseHref,
  pathname,
  canManageUsers,
}: {
  label: string;
  baseHref: string;
  pathname: string;
  canManageUsers: boolean;
}) {
  const recebimentoHref = `${baseHref}/recebimento`;
  const pagamentosPaisHref = `${baseHref}/pagamentos-pais`;
  const pixImpressoHref = `${baseHref}/pix-impresso`;
  const lancamentosLoteHref = `${baseHref}/lancamentos-lote`;
  const configuracaoEmpresaHref = `${baseHref}/configuracao-empresa`;
  const isUnderFinance = pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  const isOverview = pathname === baseHref;
  const isRecebimento = pathname === recebimentoHref || pathname.startsWith(`${recebimentoHref}/`);
  const isPagamentosPais =
    pathname === pagamentosPaisHref || pathname.startsWith(`${pagamentosPaisHref}/`);
  const isPixImpresso = pathname === pixImpressoHref || pathname.startsWith(`${pixImpressoHref}/`);
  const isLancamentosLote =
    pathname === lancamentosLoteHref || pathname.startsWith(`${lancamentosLoteHref}/`);
  const isConfiguracaoEmpresa =
    pathname === configuracaoEmpresaHref || pathname.startsWith(`${configuracaoEmpresaHref}/`);

  /** Abre por padrão quando já estamos em uma página do Financeiro (mas pode recolher manualmente). */
  const [open, setOpen] = useState(
    isUnderFinance ||
      isRecebimento ||
      isPagamentosPais ||
      isPixImpresso ||
      isLancamentosLote ||
      (canManageUsers && isConfiguracaoEmpresa),
  );
  const showSubmenu = open;

  return (
    <div className="rounded-lg">
      <div className="flex items-stretch gap-0.5 rounded-lg bg-transparent">
        <Link
          href={baseHref}
          title={label}
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
            isOverview
              ? "bg-accent text-on-accent"
              : isUnderFinance
                ? "bg-elevated-2 font-medium text-accent"
                : "text-ink hover:bg-elevated-2"
          }`}
        >
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={showSubmenu}
          aria-controls="financeiro-submenu"
          title={open ? "Recolher submenu" : "Expandir submenu"}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isOverview
              ? "bg-accent text-on-accent hover:bg-accent-hover"
              : isUnderFinance
                ? "bg-elevated-2 text-accent hover:bg-line-soft"
                : "text-muted hover:bg-elevated-2 hover:text-ink"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showSubmenu ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {showSubmenu ? (
        <ul
          id="financeiro-submenu"
          className="mt-1 space-y-0.5 border-l border-line-soft pl-2 ml-3"
          role="list"
        >
          <li>
            <Link
              href={recebimentoHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isRecebimento
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Recebimento de mensalidades
            </Link>
          </li>
          <li>
            <Link
              href={pagamentosPaisHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isPagamentosPais
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Pagamentos (pais e responsáveis)
            </Link>
          </li>
          <li>
            <Link
              href={pixImpressoHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isPixImpresso ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              PIX — impresso (QR + código)
            </Link>
          </li>
          <li>
            <Link
              href={lancamentosLoteHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isLancamentosLote ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Lançamentos em lote (pagamentos)
            </Link>
          </li>
          {canManageUsers ? (
            <li>
              <Link
                href={configuracaoEmpresaHref}
                className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                  isConfiguracaoEmpresa
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-elevated-2 hover:text-ink"
                }`}
              >
                Dados da empresa
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function AdminNavGroup({
  pathname,
  canAccessSuppliers,
  canManageUsers,
}: {
  pathname: string;
  canAccessSuppliers: boolean;
  canManageUsers: boolean;
}) {
  const baseHref = "/administracao";
  const funcionariosHref = "/funcionarios/novo";
  const fornecedoresHref = "/fornecedores";
  const estoqueLimpezaHref = "/estoque/limpeza";
  const estoqueEscolarHref = "/estoque/escolar";
  const estoqueFarmaciaHref = "/estoque/farmacia";
  const estoqueZeladoriaHref = "/estoque/zeladoria";
  const usuariosHref = "/usuarios";
  const funcoesCategoriasHref = "/administracao/funcoes-e-categorias";

  const isUnderAdmin = pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  const isOverview = pathname === baseHref;
  const isFuncionarios = pathname === funcionariosHref || pathname.startsWith(`${funcionariosHref}/`);
  const isFornecedores = pathname === fornecedoresHref || pathname.startsWith(`${fornecedoresHref}/`);
  const isEstoqueLimpeza = pathname === estoqueLimpezaHref || pathname.startsWith(`${estoqueLimpezaHref}/`);
  const isEstoqueEscolar = pathname === estoqueEscolarHref || pathname.startsWith(`${estoqueEscolarHref}/`);
  const isFarmacia = pathname === estoqueFarmaciaHref || pathname.startsWith(`${estoqueFarmaciaHref}/`);
  const isZeladoria = pathname === estoqueZeladoriaHref || pathname.startsWith(`${estoqueZeladoriaHref}/`);
  const isUsuarios =
    pathname === usuariosHref || (pathname.startsWith(`${usuariosHref}/`) && !pathname.startsWith("/usuarios/atividade"));
  const isFuncoesCategorias =
    pathname === funcoesCategoriasHref || pathname.startsWith(`${funcoesCategoriasHref}/`);

  /** Abre por padrão quando já estamos em uma página do grupo (mas pode recolher manualmente). */
  const [open, setOpen] = useState(
    isUnderAdmin ||
      isFuncionarios ||
      (canAccessSuppliers && isFornecedores) ||
      isEstoqueLimpeza ||
      isEstoqueEscolar ||
      isFarmacia ||
      isZeladoria ||
      (canManageUsers && isUsuarios) ||
      (canManageUsers && isFuncoesCategorias),
  );
  const showSubmenu = open;

  return (
    <div className="rounded-lg">
      <div className="flex items-stretch gap-0.5 rounded-lg bg-transparent">
        <Link
          href={baseHref}
          title="Administração"
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
            isOverview
              ? "bg-accent text-on-accent"
              : showSubmenu
                ? "bg-elevated-2 font-medium text-accent"
                : "text-ink hover:bg-elevated-2"
          }`}
        >
          Administração
        </Link>
        <button
          type="button"
          aria-expanded={showSubmenu}
          aria-controls="administracao-submenu"
          title={open ? "Recolher submenu" : "Expandir submenu"}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isOverview
              ? "bg-accent text-on-accent hover:bg-accent-hover"
              : showSubmenu
                ? "bg-elevated-2 text-accent hover:bg-line-soft"
                : "text-muted hover:bg-elevated-2 hover:text-ink"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showSubmenu ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {showSubmenu ? (
        <ul
          id="administracao-submenu"
          className="mt-1 ml-3 space-y-0.5 border-l border-line-soft pl-2"
          role="list"
        >
          <li>
            <Link
              href={funcionariosHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isFuncionarios ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Funcionários
            </Link>
          </li>
          {canAccessSuppliers ? (
            <li>
              <Link
                href={fornecedoresHref}
                className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                  isFornecedores ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
                }`}
              >
                Fornecedores
              </Link>
            </li>
          ) : null}
          <li>
            <Link
              href={estoqueLimpezaHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isEstoqueLimpeza ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Estoque — limpeza
            </Link>
          </li>
          <li>
            <Link
              href={estoqueEscolarHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isEstoqueEscolar ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Estoque — materiais escolar
            </Link>
          </li>
          <li>
            <Link
              href={estoqueFarmaciaHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isFarmacia ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Farmácia escolar
            </Link>
          </li>
          <li>
            <Link
              href={estoqueZeladoriaHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isZeladoria ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Zeladoria do prédio
            </Link>
          </li>
          {canManageUsers ? (
            <li>
              <Link
                href={funcoesCategoriasHref}
                className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                  isFuncoesCategorias ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
                }`}
              >
                Funções e categorias
              </Link>
            </li>
          ) : null}
          {canManageUsers ? (
            <li>
              <Link
                href={usuariosHref}
                className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                  isUsuarios ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
                }`}
              >
                Usuários
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function OpsNavGroup({
  pathname,
  branchesHref,
  propertiesHref,
  parkingHref,
  leasesHref,
}: {
  pathname: string;
  branchesHref: string;
  propertiesHref: string;
  parkingHref: string;
  leasesHref: string;
}) {
  const tenantsHref = "/locatarios";
  const isUnder =
    pathname === branchesHref ||
    pathname.startsWith(`${branchesHref}/`) ||
    pathname === propertiesHref ||
    pathname.startsWith(`${propertiesHref}/`) ||
    pathname === parkingHref ||
    pathname.startsWith(`${parkingHref}/`) ||
    pathname === leasesHref ||
    pathname.startsWith(`${leasesHref}/`) ||
    pathname === tenantsHref ||
    pathname.startsWith(`${tenantsHref}/`);

  const [open, setOpen] = useState(isUnder);
  const showSubmenu = open;

  const isBranches = pathname === branchesHref || pathname.startsWith(`${branchesHref}/`);
  const isProperties = pathname === propertiesHref || pathname.startsWith(`${propertiesHref}/`);
  const isParking = pathname === parkingHref || pathname.startsWith(`${parkingHref}/`);
  const isLeases = pathname === leasesHref || pathname.startsWith(`${leasesHref}/`);
  const isTenants = pathname === tenantsHref || pathname.startsWith(`${tenantsHref}/`);

  return (
    <div className="rounded-lg">
      <div className="flex items-stretch gap-0.5 rounded-lg bg-transparent">
        <Link
          href={branchesHref}
          title="Operações"
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
            isUnder ? "bg-elevated-2 font-medium text-accent" : "text-ink hover:bg-elevated-2"
          }`}
        >
          Operações
        </Link>
        <button
          type="button"
          aria-expanded={showSubmenu}
          aria-controls="operacoes-submenu"
          title={open ? "Recolher submenu" : "Expandir submenu"}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isUnder ? "bg-elevated-2 text-accent hover:bg-line-soft" : "text-muted hover:bg-elevated-2 hover:text-ink"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showSubmenu ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {showSubmenu ? (
        <ul
          id="operacoes-submenu"
          className="mt-1 ml-3 space-y-0.5 border-l border-line-soft pl-2"
          role="list"
        >
          <li>
            <Link
              href={branchesHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isBranches ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Filiais
            </Link>
          </li>
          <li>
            <Link
              href={propertiesHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isProperties ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Imóveis
            </Link>
          </li>
          <li>
            <Link
              href={leasesHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isLeases ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Locações
            </Link>
          </li>
          <li>
            <Link
              href={tenantsHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isTenants ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Locatários
            </Link>
          </li>
          <li>
            <Link
              href={parkingHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isParking ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Estacionamentos
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function SecurityNavGroup({ pathname }: { pathname: string }) {
  const baseHref = "/seguranca";
  const atividadesHref = "/usuarios/atividade";
  const camerasHref = "/cameras";

  const isUnderSecurity = pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  const isOverview = pathname === baseHref;
  const isAtividades = pathname === atividadesHref || pathname.startsWith(`${atividadesHref}/`);
  const isCameras = pathname === camerasHref || pathname.startsWith(`${camerasHref}/`);

  /** Abre por padrão quando já estamos em uma página do grupo (mas pode recolher manualmente). */
  const [open, setOpen] = useState(isUnderSecurity || isAtividades || isCameras);
  const showSubmenu = open;

  return (
    <div className="rounded-lg">
      <div className="flex items-stretch gap-0.5 rounded-lg bg-transparent">
        <Link
          href={baseHref}
          title="Segurança"
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
            isOverview
              ? "bg-accent text-on-accent"
              : showSubmenu
                ? "bg-elevated-2 font-medium text-accent"
                : "text-ink hover:bg-elevated-2"
          }`}
        >
          Segurança
        </Link>
        <button
          type="button"
          aria-expanded={showSubmenu}
          aria-controls="seguranca-submenu"
          title={open ? "Recolher submenu" : "Expandir submenu"}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isOverview
              ? "bg-accent text-on-accent hover:bg-accent-hover"
              : showSubmenu
                ? "bg-elevated-2 text-accent hover:bg-line-soft"
                : "text-muted hover:bg-elevated-2 hover:text-ink"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showSubmenu ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {showSubmenu ? (
        <ul
          id="seguranca-submenu"
          className="mt-1 ml-3 space-y-0.5 border-l border-line-soft pl-2"
          role="list"
        >
          <li>
            <Link
              href={atividadesHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isAtividades ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Atividades
            </Link>
          </li>
          <li>
            <Link
              href={camerasHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isCameras ? "bg-accent text-on-accent" : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Câmeras de segurança
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
