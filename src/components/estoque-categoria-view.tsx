"use client";

import type { ManagedInventoryCategory } from "@/lib/inventory-stock-meta";
import { cadastroEdicaoToggleBtnClass } from "@/components/cadastro-edicao-collapsible";
import { ExportExcelReportButton } from "@/components/export-excel-report-button";
import { FilterDateRangeFields } from "@/components/filter-date-range-fields";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  createInventoryItem,
  previewNextInventorySku,
  type CreateInventoryItemState,
} from "@/app/(main)/estoque/actions";
import { buildExcelFilename, downloadExcelSheets, formatDateBrFromIso } from "@/lib/download-excel";
import { formatBRL } from "@/lib/format-brl";
import { isMsInDateRange } from "@/lib/date-range-filter";
import { INVENTORY_STOCK_META, inventorySkuExample } from "@/lib/inventory-stock-meta";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "block text-xs font-medium text-muted";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent shadow-sm transition hover:bg-accent-hover disabled:opacity-60";
const checkboxClass = "mt-0.5 rounded border-line text-accent focus:ring-accent";

export type InventoryItemRow = {
  id: string;
  createdAt: string;
  name: string;
  productCategory: string | null;
  brand: string | null;
  sku: string | null;
  quantity: number;
  minQuantity: number;
  unit: string;
  imageUrl: string | null;
  unitPriceCents: number;
};

function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

function ItemPhotoCard({
  title,
  nameLine,
  previewUrl,
  onPickPhoto,
  footnote,
}: {
  title: string;
  nameLine: string;
  previewUrl: string | null;
  onPickPhoto: (file: File | null) => void;
  footnote?: string;
}) {
  const inputId = useId();
  return (
    <div
      className={`flex w-full min-w-0 flex-col items-center rounded-xl border bg-elevated-2 p-3 text-center shadow-sm transition-shadow md:max-w-[200px] md:shrink-0 ${
        previewUrl ? "border-accent-border ring-2 ring-accent/20" : "border-line"
      }`}
    >
      <p className="w-full text-[11px] font-semibold uppercase tracking-wide text-accent">{title}</p>
      <div className="relative mx-auto mt-2 aspect-square w-full max-w-[min(100%,10.5rem)] overflow-hidden rounded-xl bg-elevated p-2 shadow-inner ring-1 ring-line/30 md:h-[8.5rem] md:w-[8.5rem] md:max-w-none md:aspect-auto">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob)
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-contain object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] leading-snug text-subtle">
            Sem imagem
          </div>
        )}
      </div>
      <p
        className="mt-2 w-full line-clamp-2 text-center text-sm font-medium text-ink"
        title={nameLine || undefined}
      >
        {nameLine.trim() ? nameLine : "—"}
      </p>
      <input
        id={inputId}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
      />
      <label
        htmlFor={inputId}
        className="mt-2 w-full max-w-[10.5rem] cursor-pointer rounded-lg bg-accent px-2.5 py-2.5 text-center text-xs font-medium text-on-accent hover:bg-accent-hover sm:py-1.5 md:max-w-none"
      >
        Escolher imagem
      </label>
      {footnote ? (
        <p className="mt-1.5 w-full text-center text-[10px] leading-snug text-subtle">{footnote}</p>
      ) : null}
    </div>
  );
}

function FormFeedback({ state }: { state: CreateInventoryItemState | null }) {
  if (!state || state.ok) return null;
  return (
    <p className="mt-2 text-sm text-danger-text" role="alert">
      {state.error}
    </p>
  );
}

function FormSuccess({ state }: { state: CreateInventoryItemState | null }) {
  if (!state?.ok) return null;
  return (
    <p className="mt-2 text-sm text-muted" role="status">
      Item cadastrado com sucesso.
    </p>
  );
}

export function EstoqueCategoriaView({
  category,
  title,
  items,
  stockCategoryOptions,
}: {
  category: ManagedInventoryCategory;
  title: string;
  items: InventoryItemRow[];
  stockCategoryOptions: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [skuAuto, setSkuAuto] = useState(true);
  const [skuManual, setSkuManual] = useState("");
  const [skuPreview, setSkuPreview] = useState<string | null>(null);
  const [itemPhoto, setItemPhoto] = useState<File | null>(null);
  const [photoSlotKey, setPhotoSlotKey] = useState(0);
  const draftPreviewUrl = useObjectUrl(itemPhoto);

  const { skuPrefix } = INVENTORY_STOCK_META[category];
  const year = new Date().getFullYear();
  const skuExample = inventorySkuExample(skuPrefix, year);

  const [state, action, pending] = useActionState(createInventoryItem, null);

  useEffect(() => {
    let cancelled = false;
    previewNextInventorySku(category).then((v) => {
      if (!cancelled) setSkuPreview(v);
    });
    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      window.setTimeout(() => {
        setItemPhoto(null);
        setDraftName("");
        setSkuAuto(true);
        setSkuManual("");
        setPhotoSlotKey((k) => k + 1);
        void previewNextInventorySku(category).then(setSkuPreview);
        router.refresh();
      }, 0);
    }
  }, [state, router, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const createdMs = new Date(i.createdAt).getTime();
      if (!isMsInDateRange(createdMs, dateFrom, dateTo)) return false;
      if (!q) return true;
      const hay = [i.name, i.sku ?? "", i.productCategory ?? "", i.brand ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    let totalCents = 0;
    let lowCount = 0;
    for (const i of items) {
      const line = Math.round(i.quantity * i.unitPriceCents);
      totalCents += line;
      if (i.quantity <= i.minQuantity) lowCount += 1;
    }
    return { totalCents, lowCount, count: items.length };
  }, [items]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-ink sm:text-xl">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Controle de quantidades, alertas quando no mínimo ou abaixo, valores por item e total em estoque.
          </p>
        </div>
        <button
          type="button"
          className={cadastroEdicaoToggleBtnClass}
          onClick={() => setCadastroOpen((v) => !v)}
        >
          {cadastroOpen ? "Ocultar cadastro e edição" : "Cadastrar ou editar item"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line-soft bg-elevated-2 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">Valor total em estoque</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{formatBRL(metrics.totalCents)}</p>
        </div>
        <div className="rounded-xl border border-line-soft bg-elevated-2 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">Itens cadastrados</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{metrics.count}</p>
        </div>
        <div
          className={`rounded-xl border px-4 py-3 shadow-sm ${
            metrics.lowCount > 0
              ? "border-amber-500/40 bg-caution-soft/90"
              : "border-line-soft bg-elevated-2"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">Itens em atenção</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{metrics.lowCount}</p>
          <p className="text-xs text-muted">No mínimo ou abaixo</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-line-soft bg-elevated-2 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Buscar e filtrar</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="block min-w-0 flex-1 max-w-lg">
              <span className={labelClass}>Buscar item</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, código, categoria ou marca…"
                className={inputClass}
                autoComplete="off"
              />
            </label>
            <FilterDateRangeFields
              idPrefix={`estoque-${category}`}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              legend="Período (cadastro do item)"
              className="min-w-0 lg:max-w-md lg:flex-1"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <ExportExcelReportButton
              disabled={items.length === 0}
              onExport={() =>
                downloadExcelSheets(buildExcelFilename(`estoque-${category.toLowerCase()}`), [
                  {
                    sheetName: "Itens",
                    headers: [
                      "Código",
                      "Nome",
                      "Categoria produto",
                      "Marca",
                      "Quantidade",
                      "Mínimo",
                      "Unidade",
                      "Valor unitário (BRL)",
                      "Subtotal (BRL)",
                      "Status",
                      "Data cadastro",
                    ],
                    rows: filtered.map((i) => {
                      const low = i.quantity <= i.minQuantity;
                      const subtotal = Math.round(i.quantity * i.unitPriceCents);
                      return [
                        i.sku ?? "",
                        i.name,
                        i.productCategory ?? "",
                        i.brand ?? "",
                        i.quantity,
                        i.minQuantity,
                        i.unit,
                        formatBRL(i.unitPriceCents),
                        formatBRL(subtotal),
                        low ? "Estoque baixo" : "OK",
                        formatDateBrFromIso(i.createdAt),
                      ];
                    }),
                  },
                ])
              }
            />
          </div>
        </div>

        {cadastroOpen ? (
        <form ref={formRef} action={action} className="w-full min-w-0 rounded-xl border border-line bg-elevated-2 p-3 shadow-sm sm:p-4">
          <input type="hidden" name="inventoryCategory" value={category} />
          <p className="text-sm font-semibold text-ink">Cadastrar item</p>
          <p className="mt-1 text-xs text-muted">
            Preencha os dados e, se quiser, anexe uma imagem de referência (JPG, PNG ou WebP, até 3 MB).
          </p>

          <div className="mt-4 flex min-w-0 flex-col items-stretch gap-4 md:flex-row md:items-start">
            <ItemPhotoCard
              key={photoSlotKey}
              title="Imagem do item"
              nameLine={draftName}
              previewUrl={draftPreviewUrl}
              onPickPhoto={setItemPhoto}
              footnote="Opcional. Aparece na lista para identificação rápida."
            />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="rounded-lg border border-line-soft bg-shell/50 p-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="skuAuto"
                    checked={skuAuto}
                    onChange={(e) => setSkuAuto(e.target.checked)}
                    className={checkboxClass}
                  />
                  <span>
                    <span className="font-medium">Gerar código do produto automaticamente</span>
                    <span className="mt-0.5 block text-muted">
                      Sequência por ano (ex.: {skuExample}), como no cadastro de funcionário. Desmarque para digitar o
                      código.
                    </span>
                  </span>
                </label>
                <label className="mt-3 block">
                  <span className={labelClass}>
                    Código do produto
                    {!skuAuto ? <span className="text-danger-text"> *</span> : null}
                  </span>
                  {skuAuto ? (
                    <>
                      <input
                        readOnly
                        title="Valor gerado automaticamente ao salvar"
                        value={skuPreview ?? ""}
                        placeholder="Carregando prévia…"
                        autoComplete="off"
                        className={`${inputClass} cursor-default tabular-nums read-only:bg-elevated`}
                      />
                      <p className="mt-1 text-xs text-muted">
                        Próximo da sequência; será gravado ao cadastrar.
                      </p>
                    </>
                  ) : (
                    <input
                      name="skuManual"
                      value={skuManual}
                      onChange={(e) => setSkuManual(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                      placeholder={`Ex.: ${skuPrefix}${year}-INT-01`}
                      maxLength={32}
                      required
                      autoComplete="off"
                    />
                  )}
                </label>
              </div>

              <label className="block w-full">
                <span className={labelClass}>Nome</span>
                <input
                  name="name"
                  required
                  className={inputClass}
                  placeholder="Nome do produto"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </label>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Categoria</span>
                  <select
                    name="stockRegistryCategoryId"
                    className={`${inputClass} cursor-pointer`}
                    defaultValue=""
                  >
                    <option value="">— Nenhuma —</option>
                    {stockCategoryOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {stockCategoryOptions.length === 0 ? (
                    <p className="mt-1 text-[11px] leading-snug text-muted">
                      Cadastre categorias em Administração → Funções e categorias (permissão de administrador).
                    </p>
                  ) : null}
                </label>
                <label className="block">
                  <span className={labelClass}>Marca</span>
                  <input
                    name="brand"
                    maxLength={80}
                    className={inputClass}
                    placeholder="Ex.: fabricante ou marca comercial"
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
                <label className="block">
                  <span className={labelClass}>Qtd. inicial</span>
                  <input name="quantity" type="text" inputMode="decimal" className={inputClass} placeholder="0" />
                </label>
                <label className="block">
                  <span className={labelClass}>Mínimo</span>
                  <input name="minQuantity" type="text" inputMode="decimal" className={inputClass} placeholder="0" />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Unidade</span>
                <input name="unit" className={inputClass} placeholder="UN, L, pct…" defaultValue="UN" />
              </label>
              <label className="block">
                <span className={labelClass}>Valor unitário (R$)</span>
                <input
                  name="unitPrice"
                  type="text"
                  inputMode="decimal"
                  className={`${inputClass} tabular-nums`}
                  placeholder="0,00"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-stretch gap-2 sm:items-center">
            <button type="submit" disabled={pending} className={`${btnPrimary} w-full sm:w-auto`}>
              {pending ? "Salvando…" : "Cadastrar item"}
            </button>
          </div>
          <FormFeedback state={state} />
          <FormSuccess state={state} />
        </form>
        ) : null}
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-elevated-2 shadow-sm">
        <div className="border-b border-line bg-elevated px-3 py-3 sm:px-4">
          <h2 className="text-sm font-semibold text-ink">Itens em estoque</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Itens em destaque precisam de reposição (quantidade no mínimo ou abaixo do mínimo).
          </p>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-subtle">Nenhum item nesta categoria.</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-subtle">Nenhum item corresponde à busca.</p>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {filtered.map((i) => {
                const low = i.quantity <= i.minQuantity;
                const subtotal = Math.round(i.quantity * i.unitPriceCents);
                return (
                  <li
                    key={i.id}
                    className={`p-3 sm:p-4 ${
                      low
                        ? "bg-gradient-to-b from-amber-500/12 via-caution-soft/90 to-caution-soft/70"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-elevated">
                        {i.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- URL estática em /public
                          <img src={i.imageUrl} alt="" className="h-full w-full object-cover object-center" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-subtle">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words font-medium text-ink">{i.name}</p>
                            {i.sku ? (
                              <p className="mt-0.5 text-xs tabular-nums text-muted">
                                Código <span className="text-subtle">{i.sku}</span>
                              </p>
                            ) : null}
                            {i.productCategory ? (
                              <p className="mt-0.5 text-xs text-muted">
                                Categoria <span className="text-subtle">{i.productCategory}</span>
                              </p>
                            ) : null}
                            {i.brand ? (
                              <p className="mt-0.5 text-xs text-muted">
                                Marca <span className="text-subtle">{i.brand}</span>
                              </p>
                            ) : null}
                          </div>
                          {low ? (
                            <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-950 dark:text-amber-100">
                              Estoque baixo
                            </span>
                          ) : (
                            <span className="text-xs text-subtle">OK</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Qtd</p>
                            <p className={`tabular-nums text-ink ${low ? "font-semibold" : ""}`}>{i.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Mín.</p>
                            <p className="tabular-nums text-muted">{i.minQuantity}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Un.</p>
                            <p className="text-subtle">{i.unit}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">V. unit.</p>
                            <p className="tabular-nums text-muted">{formatBRL(i.unitPriceCents)}</p>
                          </div>
                          <div className="col-span-2 flex items-center justify-between gap-2 border-t border-line-soft pt-2">
                            <span className="text-xs text-muted">Subtotal</span>
                            <span className="font-semibold tabular-nums text-ink">{formatBRL(subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto overscroll-x-contain md:block">
              <table className="w-full min-w-[62rem] text-left text-sm">
                <thead className="border-b border-line bg-elevated text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium"> </th>
                    <th className="px-3 py-2 font-medium">Código</th>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium">Categoria</th>
                    <th className="px-3 py-2 font-medium">Marca</th>
                    <th className="px-3 py-2 font-medium">Qtd</th>
                    <th className="px-3 py-2 font-medium">Mín.</th>
                    <th className="px-3 py-2 font-medium">Un.</th>
                    <th className="px-3 py-2 font-medium text-right">V. unit.</th>
                    <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const low = i.quantity <= i.minQuantity;
                    const subtotal = Math.round(i.quantity * i.unitPriceCents);
                    return (
                      <tr
                        key={i.id}
                        className={`border-b border-line-soft last:border-0 ${
                          low
                            ? "bg-gradient-to-r from-amber-500/15 via-caution-soft/95 to-caution-soft/80 ring-1 ring-inset ring-amber-500/25"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2 align-middle">
                          <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-line bg-elevated">
                            {i.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- URL estática em /public
                              <img src={i.imageUrl} alt="" className="h-full w-full object-cover object-center" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[9px] text-subtle">
                                —
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted">{i.sku ?? "—"}</td>
                        <td className="max-w-[10rem] px-3 py-2 font-medium break-words text-ink lg:max-w-[12rem]">
                          {i.name}
                        </td>
                        <td className="max-w-[8rem] px-3 py-2 break-words text-muted">{i.productCategory ?? "—"}</td>
                        <td className="max-w-[8rem] px-3 py-2 break-words text-muted">{i.brand ?? "—"}</td>
                        <td className={`px-3 py-2 tabular-nums ${low ? "font-semibold text-ink" : ""}`}>
                          {i.quantity}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-muted">{i.minQuantity}</td>
                        <td className="px-3 py-2 text-subtle">{i.unit}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted">
                          {formatBRL(i.unitPriceCents)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-ink">
                          {formatBRL(subtotal)}
                        </td>
                        <td className="px-3 py-2">
                          {low ? (
                            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-950 dark:text-amber-100">
                              Estoque baixo
                            </span>
                          ) : (
                            <span className="text-xs text-subtle">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-line bg-elevated font-medium">
                  <tr>
                    <td colSpan={9} className="px-3 py-2.5 text-right text-muted">
                      Total (filtrado)
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                      {formatBRL(filtered.reduce((acc, i) => acc + Math.round(i.quantity * i.unitPriceCents), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="border-t border-line bg-elevated px-3 py-3 md:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted">Total (filtrado)</span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatBRL(filtered.reduce((acc, i) => acc + Math.round(i.quantity * i.unitPriceCents), 0))}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
