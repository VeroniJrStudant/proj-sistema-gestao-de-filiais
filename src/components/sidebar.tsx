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
  const hasModule = (id: ModuleDefinition["id"]) =>
    modules.some((m) => m.id === id);
  const showAlmoxarifado = modules.some(
    (m) =>
      m.id === "stock_cleaning" ||
      m.id === "stock_school" ||
      m.id === "stock_pharmacy" ||
      m.id === "stock_building",
  );
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
            servicosHref={leasesModule?.href ?? "/servicos/catalogo"}
            showLeaseAuxNav={!!leasesModule}
          />
        ) : null}
        <AdminNavGroup
          pathname={pathname}
          canAccessSuppliers={canAccessSuppliers}
          canManageUsers={canManageUsers}
          showAlmoxarifado={showAlmoxarifado}
        />
        <NavLink href="/mural" active={pathname === "/mural"}>
          Mural
        </NavLink>
        <NavLink href="/clientes" active={pathname === "/clientes" || pathname.startsWith("/clientes/")}>
          Clientes
        </NavLink>
        {hasModule("attendance") ? (
          <NavLink
            href="/presenca"
            active={
              pathname === "/presenca" || pathname.startsWith("/presenca/")
            }
          >
            Registro de entrada/saída
          </NavLink>
        ) : null}
        <SecurityNavGroup pathname={pathname} />
      </nav>
      <div className="border-t border-line p-2">
        {sessionLabel ? (
          <p
            className="mb-2 truncate px-3 text-xs text-subtle"
            title={sessionLabel}
          >
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
        active ? "bg-accent text-on-accent" : "text-ink hover:bg-elevated-2"
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
  const entradasHref = `${baseHref}/entradas`;
  const saidasHref = `${baseHref}/saidas`;
  const configuracaoEmpresaHref = `${baseHref}/configuracao-empresa`;
  const isUnderFinance =
    pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  const isOverview = pathname === baseHref;
  const isEntradas =
    pathname === entradasHref || pathname.startsWith(`${entradasHref}/`);
  const isSaidas = pathname === saidasHref || pathname.startsWith(`${saidasHref}/`);
  const isConfiguracaoEmpresa =
    pathname === configuracaoEmpresaHref ||
    pathname.startsWith(`${configuracaoEmpresaHref}/`);

  /** Abre por padrão quando já estamos em uma página do Financeiro (mas pode recolher manualmente). */
  const [open, setOpen] = useState(
    isUnderFinance ||
      isEntradas ||
      isSaidas ||
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
              href={entradasHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isEntradas
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Entradas
            </Link>
          </li>
          <li>
            <Link
              href={saidasHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isSaidas
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Saídas
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
  showAlmoxarifado,
}: {
  pathname: string;
  canAccessSuppliers: boolean;
  canManageUsers: boolean;
  showAlmoxarifado: boolean;
}) {
  const baseHref = "/administracao";
  const funcionariosHref = "/funcionarios/novo";
  const fornecedoresHref = "/fornecedores";
  const almoxarifadoHref = "/estoque/almoxarifado";
  const usuariosHref = "/usuarios";
  const funcoesCategoriasHref = "/administracao/funcoes-e-categorias";

  const isUnderAdmin =
    pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  const isOverview = pathname === baseHref;
  const isFuncionarios =
    pathname === funcionariosHref ||
    pathname.startsWith(`${funcionariosHref}/`);
  const isFornecedores =
    pathname === fornecedoresHref ||
    pathname.startsWith(`${fornecedoresHref}/`);
  const isAlmoxarifado =
    pathname === almoxarifadoHref ||
    pathname.startsWith(`${almoxarifadoHref}/`) ||
    pathname === "/estoque/limpeza" ||
    pathname.startsWith("/estoque/limpeza/") ||
    pathname === "/estoque/escolar" ||
    pathname.startsWith("/estoque/escolar/") ||
    pathname === "/estoque/farmacia" ||
    pathname.startsWith("/estoque/farmacia/") ||
    pathname === "/estoque/zeladoria" ||
    pathname.startsWith("/estoque/zeladoria/");
  const isUsuarios =
    pathname === usuariosHref ||
    (pathname.startsWith(`${usuariosHref}/`) &&
      !pathname.startsWith("/usuarios/atividade"));
  const isFuncoesCategorias =
    pathname === funcoesCategoriasHref ||
    pathname.startsWith(`${funcoesCategoriasHref}/`);

  /** Abre por padrão quando já estamos em uma página do grupo (mas pode recolher manualmente). */
  const [open, setOpen] = useState(
    isUnderAdmin ||
      isFuncionarios ||
      (canAccessSuppliers && isFornecedores) ||
      isAlmoxarifado ||
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
                isFuncionarios
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
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
                  isFornecedores
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-elevated-2 hover:text-ink"
                }`}
              >
                Fornecedores
              </Link>
            </li>
          ) : null}
          {showAlmoxarifado ? (
            <li>
              <Link
                href={almoxarifadoHref}
                className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                  isAlmoxarifado
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-elevated-2 hover:text-ink"
                }`}
              >
                Almoxarifado
              </Link>
            </li>
          ) : null}
          {canManageUsers ? (
            <li>
              <Link
                href={funcoesCategoriasHref}
                className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                  isFuncoesCategorias
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-elevated-2 hover:text-ink"
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
                  isUsuarios
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-elevated-2 hover:text-ink"
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
  servicosHref,
  showLeaseAuxNav,
}: {
  pathname: string;
  branchesHref: string;
  propertiesHref: string;
  parkingHref: string;
  servicosHref: string;
  showLeaseAuxNav: boolean;
}) {
  const isUnder =
    pathname === branchesHref ||
    pathname.startsWith(`${branchesHref}/`) ||
    pathname === propertiesHref ||
    pathname.startsWith(`${propertiesHref}/`) ||
    pathname === parkingHref ||
    pathname.startsWith(`${parkingHref}/`) ||
    pathname === servicosHref ||
    pathname.startsWith(`${servicosHref}/`) ||
    pathname === "/servicos" ||
    pathname.startsWith("/servicos/") ||
    pathname === "/locacoes" ||
    pathname.startsWith("/locacoes/") ||
    pathname === "/locatarios" ||
    pathname.startsWith("/locatarios/");

  const [open, setOpen] = useState(isUnder);
  const showSubmenu = open;

  const isBranches =
    pathname === branchesHref || pathname.startsWith(`${branchesHref}/`);
  const isProperties =
    pathname === propertiesHref || pathname.startsWith(`${propertiesHref}/`);
  const isParking =
    pathname === parkingHref || pathname.startsWith(`${parkingHref}/`);
  const isLeaseLocacoes =
    pathname === "/servicos/locacoes" || pathname.startsWith("/servicos/locacoes/");
  const isLeaseLocatarios =
    pathname === "/servicos/locatarios" || pathname.startsWith("/servicos/locatarios/");

  const isServicos =
    pathname === servicosHref ||
    pathname.startsWith(`${servicosHref}/`) ||
    pathname === "/servicos" ||
    pathname.startsWith("/servicos/") ||
    pathname === "/locacoes" ||
    pathname.startsWith("/locacoes/") ||
    pathname === "/locatarios" ||
    pathname.startsWith("/locatarios/");

  return (
    <div className="rounded-lg">
      <div className="flex items-stretch gap-0.5 rounded-lg bg-transparent">
        <Link
          href={branchesHref}
          title="Operações"
          className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
            isUnder
              ? "bg-elevated-2 font-medium text-accent"
              : "text-ink hover:bg-elevated-2"
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
            isUnder
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
          id="operacoes-submenu"
          className="mt-1 ml-3 space-y-0.5 border-l border-line-soft pl-2"
          role="list"
        >
          <li>
            <Link
              href={branchesHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isBranches
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Filiais
            </Link>
          </li>
          <li>
            <Link
              href={propertiesHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isProperties
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Imóveis
            </Link>
          </li>
          <li>
            <Link
              href={parkingHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isParking
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Estacionamentos
            </Link>
          </li>
          <li>
            <Link
              href={servicosHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isServicos && !isLeaseLocacoes && !isLeaseLocatarios
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Serviços
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

  const isUnderSecurity =
    pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  const isOverview = pathname === baseHref;
  const isAtividades =
    pathname === atividadesHref || pathname.startsWith(`${atividadesHref}/`);
  const isCameras =
    pathname === camerasHref || pathname.startsWith(`${camerasHref}/`);

  /** Abre por padrão quando já estamos em uma página do grupo (mas pode recolher manualmente). */
  const [open, setOpen] = useState(
    isUnderSecurity || isAtividades || isCameras,
  );
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
                isAtividades
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
              }`}
            >
              Atividades
            </Link>
          </li>
          <li>
            <Link
              href={camerasHref}
              className={`block rounded-md px-2 py-1.5 text-xs leading-snug transition-colors ${
                isCameras
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-elevated-2 hover:text-ink"
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
