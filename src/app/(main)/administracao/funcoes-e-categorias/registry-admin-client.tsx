"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createEmployeeJobRole,
  createRegistryCategory,
  deleteEmployeeJobRole,
  deleteRegistryCategory,
  updateEmployeeJobRole,
  updateRegistryCategory,
} from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-medium text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-50";
const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm font-medium text-ink hover:bg-elevated";

type JobRoleRow = { id: string; name: string; active: boolean; sortOrder: number };
type CatRow = { id: string; name: string; active: boolean; sortOrder: number; scope: string };

export function RegistryAdminClient({
  initialJobRoles,
  initialCategoriesEmployee,
  initialCategoriesSupplier,
  initialCategoriesStockCleaning,
  initialCategoriesStockSchool,
  initialCategoriesStockBuilding,
}: {
  initialJobRoles: JobRoleRow[];
  initialCategoriesEmployee: CatRow[];
  initialCategoriesSupplier: CatRow[];
  initialCategoriesStockCleaning: CatRow[];
  initialCategoriesStockSchool: CatRow[];
  initialCategoriesStockBuilding: CatRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "EMPLOYEE"
    | "SUPPLIER"
    | "STOCK_CLEANING"
    | "STOCK_SCHOOL_SUPPLIES"
    | "STOCK_BUILDING_MAINTENANCE"
  >("EMPLOYEE");

  const [newJobName, setNewJobName] = useState("");
  const [newCatEmp, setNewCatEmp] = useState("");
  const [newCatSup, setNewCatSup] = useState("");
  const [newStockCleaning, setNewStockCleaning] = useState("");
  const [newStockSchool, setNewStockSchool] = useState("");
  const [newStockBuilding, setNewStockBuilding] = useState("");

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
        >
          {error}
        </div>
      ) : null}

      <div
        className="flex flex-wrap gap-1 rounded-lg border border-line-soft bg-elevated-2 p-1"
        role="tablist"
        aria-label="Lista a exibir"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "EMPLOYEE"}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            activeTab === "EMPLOYEE"
              ? "bg-accent text-on-accent shadow-sm"
              : "text-muted hover:bg-line-soft hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("EMPLOYEE")}
          disabled={pending}
        >
          Funcionários
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "SUPPLIER"}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            activeTab === "SUPPLIER"
              ? "bg-accent text-on-accent shadow-sm"
              : "text-muted hover:bg-line-soft hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("SUPPLIER")}
          disabled={pending}
        >
          Fornecedores
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "STOCK_CLEANING"}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            activeTab === "STOCK_CLEANING"
              ? "bg-accent text-on-accent shadow-sm"
              : "text-muted hover:bg-line-soft hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("STOCK_CLEANING")}
          disabled={pending}
        >
          Limpeza
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "STOCK_SCHOOL_SUPPLIES"}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            activeTab === "STOCK_SCHOOL_SUPPLIES"
              ? "bg-accent text-on-accent shadow-sm"
              : "text-muted hover:bg-line-soft hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("STOCK_SCHOOL_SUPPLIES")}
          disabled={pending}
        >
          Material de escritório
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "STOCK_BUILDING_MAINTENANCE"}
          className={[
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            activeTab === "STOCK_BUILDING_MAINTENANCE"
              ? "bg-accent text-on-accent shadow-sm"
              : "text-muted hover:bg-line-soft hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("STOCK_BUILDING_MAINTENANCE")}
          disabled={pending}
        >
          Zeladoria
        </button>
      </div>

      {activeTab === "EMPLOYEE" ? (
        <>
          <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Funções (funcionários)</h2>
            <p className="mt-1 text-sm text-muted">
              Itens usados no campo &quot;Função&quot; do cadastro de funcionários.
            </p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  const r = await createEmployeeJobRole(newJobName);
                  if (!r.ok) {
                    setError(r.error);
                    return;
                  }
                  setNewJobName("");
                  refresh();
                });
              }}
            >
              <label className="min-w-0 flex-1">
                <span className={labelClass}>Nova função</span>
                <input
                  className={inputClass}
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  placeholder="Ex.: professora, auxiliar de berçário…"
                  maxLength={120}
                />
              </label>
              <button type="submit" className={btnPrimary} disabled={pending}>
                Adicionar
              </button>
            </form>

            <ul className="mt-6 divide-y divide-line-soft rounded-xl border border-line-soft bg-shell/40">
              {initialJobRoles.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted">Nenhuma função cadastrada ainda.</li>
              ) : (
                initialJobRoles.map((row) => (
                  <JobRoleEditableRow
                    key={row.id}
                    row={row}
                    disabled={pending}
                    onError={setError}
                    onSaved={() => {
                      setError(null);
                      refresh();
                    }}
                  />
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Categorias — funcionários</h2>
            <p className="mt-1 text-sm text-muted">
              Classificação opcional no cadastro de funcionários (ex.: docente, administrativo).
            </p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  const r = await createRegistryCategory(newCatEmp, "EMPLOYEE");
                  if (!r.ok) {
                    setError(r.error);
                    return;
                  }
                  setNewCatEmp("");
                  refresh();
                });
              }}
            >
              <label className="min-w-0 flex-1">
                <span className={labelClass}>Nova categoria</span>
                <input
                  className={inputClass}
                  value={newCatEmp}
                  onChange={(e) => setNewCatEmp(e.target.value)}
                  maxLength={120}
                />
              </label>
              <button type="submit" className={btnPrimary} disabled={pending}>
                Adicionar
              </button>
            </form>
            <CategoryList
              rows={initialCategoriesEmployee}
              disabled={pending}
              onError={setError}
              onSaved={refresh}
            />
          </section>
        </>
      ) : null}

      {activeTab === "SUPPLIER" ? (
        <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Categorias — fornecedores</h2>
          <p className="mt-1 text-sm text-muted">
            Classificação opcional no cadastro de fornecedores (ex.: alimentação, material).
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const r = await createRegistryCategory(newCatSup, "SUPPLIER");
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                setNewCatSup("");
                refresh();
              });
            }}
          >
            <label className="min-w-0 flex-1">
              <span className={labelClass}>Nova categoria</span>
              <input
                className={inputClass}
                value={newCatSup}
                onChange={(e) => setNewCatSup(e.target.value)}
                maxLength={120}
              />
            </label>
            <button type="submit" className={btnPrimary} disabled={pending}>
              Adicionar
            </button>
          </form>
          <CategoryList
            rows={initialCategoriesSupplier}
            disabled={pending}
            onError={setError}
            onSaved={refresh}
          />
        </section>
      ) : null}

      {activeTab === "STOCK_CLEANING" ? (
        <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Limpeza</h2>
          <p className="mt-1 text-sm text-muted">
            Categorias de itens do estoque de limpeza (higiene).
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const r = await createRegistryCategory(newStockCleaning, "STOCK_CLEANING");
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                setNewStockCleaning("");
                refresh();
              });
            }}
          >
            <label className="min-w-0 flex-1">
              <span className={labelClass}>Nova categoria</span>
              <input
                className={inputClass}
                value={newStockCleaning}
                onChange={(e) => setNewStockCleaning(e.target.value)}
                maxLength={120}
              />
            </label>
            <button type="submit" className={btnPrimary} disabled={pending}>
              Adicionar
            </button>
          </form>
          <CategoryList
            rows={initialCategoriesStockCleaning}
            disabled={pending}
            onError={setError}
            onSaved={refresh}
          />
        </section>
      ) : null}

      {activeTab === "STOCK_SCHOOL_SUPPLIES" ? (
        <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Material de escritório</h2>
          <p className="mt-1 text-sm text-muted">Categorias de papelaria, consumíveis e itens de escritório.</p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const r = await createRegistryCategory(newStockSchool, "STOCK_SCHOOL_SUPPLIES");
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                setNewStockSchool("");
                refresh();
              });
            }}
          >
            <label className="min-w-0 flex-1">
              <span className={labelClass}>Nova categoria</span>
              <input
                className={inputClass}
                value={newStockSchool}
                onChange={(e) => setNewStockSchool(e.target.value)}
                maxLength={120}
              />
            </label>
            <button type="submit" className={btnPrimary} disabled={pending}>
              Adicionar
            </button>
          </form>
          <CategoryList
            rows={initialCategoriesStockSchool}
            disabled={pending}
            onError={setError}
            onSaved={refresh}
          />
        </section>
      ) : null}

      {activeTab === "STOCK_BUILDING_MAINTENANCE" ? (
        <section className="rounded-2xl border border-line bg-elevated-2 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Zeladoria</h2>
          <p className="mt-1 text-sm text-muted">Categorias de manutenção, conservação e material predial.</p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const r = await createRegistryCategory(newStockBuilding, "STOCK_BUILDING_MAINTENANCE");
                if (!r.ok) {
                  setError(r.error);
                  return;
                }
                setNewStockBuilding("");
                refresh();
              });
            }}
          >
            <label className="min-w-0 flex-1">
              <span className={labelClass}>Nova categoria</span>
              <input
                className={inputClass}
                value={newStockBuilding}
                onChange={(e) => setNewStockBuilding(e.target.value)}
                maxLength={120}
              />
            </label>
            <button type="submit" className={btnPrimary} disabled={pending}>
              Adicionar
            </button>
          </form>
          <CategoryList
            rows={initialCategoriesStockBuilding}
            disabled={pending}
            onError={setError}
            onSaved={refresh}
          />
        </section>
      ) : null}
    </div>
  );
}

function JobRoleEditableRow({
  row,
  disabled,
  onError,
  onSaved,
}: {
  row: JobRoleRow;
  disabled: boolean;
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || pending}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnGhost}
          disabled={disabled || pending}
          onClick={() => {
            onError(null);
            startTransition(async () => {
              const r = await updateEmployeeJobRole(row.id, { active: !row.active });
              if (!r.ok) {
                onError(r.error);
                return;
              }
              onSaved();
            });
          }}
        >
          {row.active ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={disabled || pending || name.trim() === row.name}
          onClick={() => {
            onError(null);
            startTransition(async () => {
              const r = await updateEmployeeJobRole(row.id, { name });
              if (!r.ok) {
                onError(r.error);
                return;
              }
              onSaved();
            });
          }}
        >
          Salvar
        </button>
        <button
          type="button"
          className={`${btnGhost} border-danger-border text-danger-text hover:bg-danger-bg`}
          disabled={disabled || pending}
          onClick={() => {
            if (!window.confirm("Excluir esta função?")) return;
            onError(null);
            startTransition(async () => {
              const r = await deleteEmployeeJobRole(row.id);
              if (!r.ok) {
                onError(r.error);
                return;
              }
              onSaved();
            });
          }}
        >
          Excluir
        </button>
      </div>
    </li>
  );
}

function CategoryList({
  rows,
  disabled,
  onError,
  onSaved,
}: {
  rows: CatRow[];
  disabled: boolean;
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  return (
    <ul className="mt-6 divide-y divide-line-soft rounded-xl border border-line-soft bg-shell/40">
      {rows.length === 0 ? (
        <li className="px-4 py-6 text-sm text-muted">Nenhuma categoria cadastrada ainda.</li>
      ) : (
        rows.map((row) => (
          <CategoryEditableRow key={row.id} row={row} disabled={disabled} onError={onError} onSaved={onSaved} />
        ))
      )}
    </ul>
  );
}

function CategoryEditableRow({
  row,
  disabled,
  onError,
  onSaved,
}: {
  row: CatRow;
  disabled: boolean;
  onError: (msg: string | null) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || pending}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnGhost}
          disabled={disabled || pending}
          onClick={() => {
            onError(null);
            startTransition(async () => {
              const r = await updateRegistryCategory(row.id, { active: !row.active });
              if (!r.ok) {
                onError(r.error);
                return;
              }
              onSaved();
            });
          }}
        >
          {row.active ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          className={btnPrimary}
          disabled={disabled || pending || name.trim() === row.name}
          onClick={() => {
            onError(null);
            startTransition(async () => {
              const r = await updateRegistryCategory(row.id, { name });
              if (!r.ok) {
                onError(r.error);
                return;
              }
              onSaved();
            });
          }}
        >
          Salvar
        </button>
        <button
          type="button"
          className={`${btnGhost} border-danger-border text-danger-text hover:bg-danger-bg`}
          disabled={disabled || pending}
          onClick={() => {
            if (!window.confirm("Excluir esta categoria?")) return;
            onError(null);
            startTransition(async () => {
              const r = await deleteRegistryCategory(row.id);
              if (!r.ok) {
                onError(r.error);
                return;
              }
              onSaved();
            });
          }}
        >
          Excluir
        </button>
      </div>
    </li>
  );
}
