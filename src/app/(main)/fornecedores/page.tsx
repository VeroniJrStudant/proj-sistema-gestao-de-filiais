import { Suspense } from "react";
import { CategoryScope } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { FornecedorShell } from "./fornecedor-shell";
import { SupplierPageHeader } from "./supplier-page-header";
import { type SupplierFormInitial } from "./supplier-form";
import type { SupplierPickerRow } from "./supplier-search-panel";

type SearchParams = { ok?: string; fornecedor?: string; cadastro?: string; ficha?: string };

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function FornecedoresPageInner({ searchParams }: { searchParams: SearchParams }) {
  const supplierCategoryOptions = await prisma.registryCategory.findMany({
    where: { active: true, scope: CategoryScope.SUPPLIER },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const ok = searchParams.ok === "1";
  const fornecedorId = searchParams.fornecedor?.trim() ?? null;
  const initialCadastroOpen = searchParams.cadastro === "1" || searchParams.ok === "1";
  const revealFichaFromParams =
    searchParams.ficha === "1" || searchParams.cadastro === "1" || searchParams.ok === "1";

  let savedName: string | null = null;
  let savedTradeName: string | null = null;
  let savedSupplierCode: string | null = null;
  let savedActive = true;
  let initialForm: SupplierFormInitial | undefined;

  if (fornecedorId) {
    const row = await prisma.supplier.findUnique({
      where: { id: fornecedorId },
    });
    if (row) {
      savedName = row.name.trim();
      savedTradeName = row.tradeName?.trim() || null;
      savedSupplierCode = row.supplierCode?.trim() || null;
      savedActive = row.active;
      initialForm = {
        supplierCode: row.supplierCode?.trim() ?? null,
        supplierCategoryId: row.supplierCategoryId,
        name: row.name.trim(),
        tradeName: row.tradeName?.trim() ?? "",
        document: row.document?.trim() ?? "",
        phone: row.phone?.trim() ?? "",
        email: row.email?.trim() ?? "",
        street: row.street?.trim() ?? "",
        number: row.number?.trim() ?? "",
        complement: row.complement?.trim() ?? "",
        neighborhood: row.neighborhood?.trim() ?? "",
        city: row.city?.trim() ?? "",
        state: row.state?.trim() ?? "",
        zip: row.zip?.trim() ?? "",
        notes: row.notes?.trim() ?? "",
        paymentMethod: row.paymentMethod?.trim() ?? "",
        paymentDate: isoToDateInput(row.paymentDate?.toISOString() ?? null),
        active: row.active,
      } satisfies SupplierFormInitial;
    }
  }

  const pickerRows = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { supplierCategory: { select: { name: true } } },
  });

  const supplierPickerRows: SupplierPickerRow[] = pickerRows.map((s) => ({
    id: s.id,
    supplierCode: s.supplierCode?.trim() ?? null,
    supplierCategoryName: s.supplierCategory?.name?.trim() ?? null,
    name: s.name.trim(),
    tradeName: s.tradeName?.trim() ?? null,
    document: s.document?.trim() ?? null,
    phone: s.phone?.trim() ?? null,
    email: s.email?.trim() ?? null,
    street: s.street?.trim() ?? null,
    number: s.number?.trim() ?? null,
    complement: s.complement?.trim() ?? null,
    neighborhood: s.neighborhood?.trim() ?? null,
    city: s.city?.trim() ?? null,
    state: s.state?.trim() ?? null,
    zip: s.zip?.trim() ?? null,
    notes: s.notes?.trim() ?? null,
    paymentMethod: s.paymentMethod?.trim() ?? null,
    paymentDate: s.paymentDate?.toISOString() ?? null,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const effectiveFornecedorId = fornecedorId && initialForm ? fornecedorId : null;

  const shellLayoutKey = [
    effectiveFornecedorId ?? "novo",
    searchParams.cadastro ?? "",
    searchParams.ficha ?? "",
    searchParams.ok ?? "",
  ].join("|");

  return (
    <FornecedorShell
      key={shellLayoutKey}
      effectiveFornecedorId={effectiveFornecedorId}
      revealFichaFromParams={revealFichaFromParams}
      initialCadastroOpen={initialCadastroOpen}
      ok={ok}
      lastSavedSupplierId={effectiveFornecedorId ?? undefined}
      initialForm={initialForm}
      supplierCategoryOptions={supplierCategoryOptions}
      suppliers={supplierPickerRows}
      header={
        <SupplierPageHeader
          fornecedorId={effectiveFornecedorId}
          savedName={savedName}
          savedTradeName={savedTradeName}
          savedSupplierCode={savedSupplierCode}
          fichaActive={effectiveFornecedorId ? savedActive : undefined}
        />
      }
    />
  );
}

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto min-w-0 max-w-6xl px-3 sm:px-4">
      <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
        <FornecedoresPageInner searchParams={sp} />
      </Suspense>
    </div>
  );
}
