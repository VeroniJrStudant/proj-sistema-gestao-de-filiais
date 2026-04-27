import Link from "next/link";
import { CategoryScope } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { RegistryAdminClient } from "./registry-admin-client";

export default async function FuncoesECategoriasPage() {
  const [
    jobRoles,
    categoriesEmployee,
    categoriesSupplier,
    categoriesStockCleaning,
    categoriesStockSchool,
    categoriesStockPharmacy,
    categoriesStockBuilding,
  ] = await Promise.all([
    prisma.employeeJobRole.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.registryCategory.findMany({
      where: { scope: CategoryScope.EMPLOYEE },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.registryCategory.findMany({
      where: { scope: CategoryScope.SUPPLIER },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.registryCategory.findMany({
      where: { scope: CategoryScope.STOCK_CLEANING },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.registryCategory.findMany({
      where: { scope: CategoryScope.STOCK_SCHOOL_SUPPLIES },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.registryCategory.findMany({
      where: { scope: CategoryScope.STOCK_PHARMACY },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.registryCategory.findMany({
      where: { scope: CategoryScope.STOCK_BUILDING_MAINTENANCE },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-6">
      <header className="rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Administração</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Funções e categorias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Cadastre funções, categorias de funcionários e fornecedores e categorias por módulo de estoque (limpeza,
          material escolar, farmácia e zeladoria). Itens inativos não aparecem nas listas de seleção.
        </p>
        <p className="mt-4">
          <Link href="/administracao" className="text-sm font-medium text-accent hover:underline">
            ← Voltar à administração
          </Link>
        </p>
      </header>

      <RegistryAdminClient
        initialJobRoles={jobRoles}
        initialCategoriesEmployee={categoriesEmployee}
        initialCategoriesSupplier={categoriesSupplier}
        initialCategoriesStockCleaning={categoriesStockCleaning}
        initialCategoriesStockSchool={categoriesStockSchool}
        initialCategoriesStockPharmacy={categoriesStockPharmacy}
        initialCategoriesStockBuilding={categoriesStockBuilding}
      />
    </div>
  );
}
