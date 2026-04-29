import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import type { PermissionId } from "@/lib/auth/permissions";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

type ExportFormat = "csv" | "xlsx";

type DatasetId =
  | "financeiro-lancamentos"
  | "clientes"
  | "fornecedores"
  | "filiais"
  | "imoveis"
  | "estacionamentos"
  | "estoque-itens";

const DATASET_LABEL: Record<DatasetId, string> = {
  "financeiro-lancamentos": "financeiro-lancamentos",
  clientes: "clientes",
  fornecedores: "fornecedores",
  filiais: "filiais",
  imoveis: "imoveis",
  estacionamentos: "estacionamentos",
  "estoque-itens": "estoque-itens",
};

const DATASET_PERMISSION: Partial<Record<DatasetId, PermissionId>> = {
  "financeiro-lancamentos": "finance.access",
  clientes: "finance.access",
  fornecedores: "suppliers.access",
  "estoque-itens": "stock.access",
};

function parseFormat(v: string | null): ExportFormat | null {
  if (v === "csv" || v === "xlsx") return v;
  return null;
}

function isDatasetId(value: string): value is DatasetId {
  return (
    value === "financeiro-lancamentos" ||
    value === "clientes" ||
    value === "fornecedores" ||
    value === "filiais" ||
    value === "imoveis" ||
    value === "estacionamentos" ||
    value === "estoque-itens"
  );
}

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  // RFC4180-ish: wrap if contains special chars; escape quotes.
  const needs = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(csvCell).join(","));
  for (const r of rows) {
    lines.push(r.map(csvCell).join(","));
  }
  return lines.join("\r\n");
}

function asIsoDateOnly(d: Date | null | undefined): string {
  if (!d) return "";
  const t = d.getTime();
  if (Number.isNaN(t)) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateOnly(v: string | null): Date | null {
  const raw = (v ?? "").trim();
  if (!raw) return null;
  // Expect yyyy-mm-dd
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function rangeWhere(from: Date | null, to: Date | null): { gte?: Date; lt?: Date } | undefined {
  if (!from && !to) return undefined;
  const out: { gte?: Date; lt?: Date } = {};
  if (from) out.gte = from;
  if (to) {
    // make it inclusive by adding 1 day and using lt
    const end = new Date(to);
    end.setUTCDate(end.getUTCDate() + 1);
    out.lt = end;
  }
  return out;
}

function buildXlsxBuffer(sheetName: string, headers: string[], rows: (string | number)[][]): Uint8Array {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer | Uint8Array;
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

function fileStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}${m}${day}-${hh}${mm}`;
}

export async function GET(request: Request) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!session.permissions.includes("dashboard.view")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(request.url);
  const datasetRaw = (url.searchParams.get("dataset") ?? "").trim();
  const format = parseFormat(url.searchParams.get("format"));
  const from = parseDateOnly(url.searchParams.get("from"));
  const to = parseDateOnly(url.searchParams.get("to"));

  if (!format) {
    return NextResponse.json({ error: "Formato inválido. Use format=csv ou format=xlsx." }, { status: 400 });
  }

  if (!isDatasetId(datasetRaw)) {
    return NextResponse.json({ error: "Dataset inválido." }, { status: 400 });
  }

  const needed = DATASET_PERMISSION[datasetRaw];
  if (needed && !session.permissions.includes(needed)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const stamp = fileStamp();
  const baseName = `${DATASET_LABEL[datasetRaw]}-${stamp}`;

  if (datasetRaw === "financeiro-lancamentos") {
    const createdAt = rangeWhere(from, to);
    const rows = await prisma.financialRecord.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        direction: true,
        kind: true,
        status: true,
        amountCents: true,
        dueDate: true,
        settledAt: true,
        description: true,
        externalRef: true,
        branch: { select: { code: true, name: true } },
        property: { select: { code: true, name: true } },
        parkingFacility: { select: { code: true, name: true } },
      },
    });

    const headers = [
      "criado_em",
      "direcao",
      "tipo",
      "status",
      "valor_centavos",
      "vencimento",
      "liquidado_em",
      "descricao",
      "ref_externa",
      "filial_codigo",
      "filial_nome",
      "imovel_codigo",
      "imovel_nome",
      "estacionamento_codigo",
      "estacionamento_nome",
    ];
    const outRows = rows.map((r) => [
      r.createdAt.toISOString(),
      r.direction,
      r.kind,
      r.status,
      r.amountCents,
      asIsoDateOnly(r.dueDate),
      r.settledAt ? r.settledAt.toISOString() : "",
      r.description ?? "",
      r.externalRef ?? "",
      r.branch?.code ?? "",
      r.branch?.name ?? "",
      r.property?.code ?? "",
      r.property?.name ?? "",
      r.parkingFacility?.code ?? "",
      r.parkingFacility?.name ?? "",
    ]);

    if (format === "csv") {
      const csv = toCsv(headers, outRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
        },
      });
    }

    const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
    const buf = buildXlsxBuffer("Lancamentos", headers, xlsxRows);
    return new NextResponse(asArrayBuffer(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
      },
    });
  }

  if (datasetRaw === "clientes") {
    const createdAt = rangeWhere(from, to);
    const rows = await prisma.customer.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        kind: true,
        billingProfile: true,
        name: true,
        tradeName: true,
        documentType: true,
        document: true,
        phone: true,
        email: true,
        operationLinkKind: true,
        branch: { select: { code: true, name: true } },
        property: { select: { code: true, name: true } },
        parkingFacility: { select: { code: true, name: true } },
        active: true,
      },
    });
    const headers = [
      "criado_em",
      "ativo",
      "tipo",
      "perfil_cobranca",
      "nome",
      "nome_fantasia",
      "documento_tipo",
      "documento",
      "telefone",
      "email",
      "vinculo_tipo",
      "filial_codigo",
      "filial_nome",
      "imovel_codigo",
      "imovel_nome",
      "estacionamento_codigo",
      "estacionamento_nome",
    ];
    const outRows = rows.map((r) => [
      r.createdAt.toISOString(),
      r.active ? "SIM" : "NAO",
      r.kind,
      r.billingProfile,
      r.name,
      r.tradeName ?? "",
      r.documentType,
      r.document ?? "",
      r.phone ?? "",
      r.email ?? "",
      r.operationLinkKind,
      r.branch?.code ?? "",
      r.branch?.name ?? "",
      r.property?.code ?? "",
      r.property?.name ?? "",
      r.parkingFacility?.code ?? "",
      r.parkingFacility?.name ?? "",
    ]);

    if (format === "csv") {
      const csv = toCsv(headers, outRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
        },
      });
    }
    const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
    const buf = buildXlsxBuffer("Clientes", headers, xlsxRows);
    return new NextResponse(asArrayBuffer(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
      },
    });
  }

  if (datasetRaw === "fornecedores") {
    const createdAt = rangeWhere(from, to);
    const rows = await prisma.supplier.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        active: true,
        supplierCode: true,
        name: true,
        tradeName: true,
        document: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        paymentMethod: true,
        notes: true,
      },
    });
    const headers = [
      "criado_em",
      "ativo",
      "codigo",
      "nome",
      "nome_fantasia",
      "documento",
      "telefone",
      "email",
      "cidade",
      "uf",
      "pagamento_metodo",
      "observacoes",
    ];
    const outRows = rows.map((r) => [
      r.createdAt.toISOString(),
      r.active ? "SIM" : "NAO",
      r.supplierCode ?? "",
      r.name,
      r.tradeName ?? "",
      r.document ?? "",
      r.phone ?? "",
      r.email ?? "",
      r.city ?? "",
      r.state ?? "",
      r.paymentMethod ?? "",
      r.notes ?? "",
    ]);

    if (format === "csv") {
      const csv = toCsv(headers, outRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
        },
      });
    }
    const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
    const buf = buildXlsxBuffer("Fornecedores", headers, xlsxRows);
    return new NextResponse(asArrayBuffer(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
      },
    });
  }

  if (datasetRaw === "filiais") {
    const createdAt = rangeWhere(from, to);
    const rows = await prisma.branch.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        active: true,
        code: true,
        name: true,
        phone: true,
        email: true,
        document: true,
        city: true,
        state: true,
        notes: true,
      },
    });
    const headers = ["criado_em", "ativo", "codigo", "nome", "telefone", "email", "documento", "cidade", "uf", "observacoes"];
    const outRows = rows.map((r) => [
      r.createdAt.toISOString(),
      r.active ? "SIM" : "NAO",
      r.code ?? "",
      r.name,
      r.phone ?? "",
      r.email ?? "",
      r.document ?? "",
      r.city ?? "",
      r.state ?? "",
      r.notes ?? "",
    ]);

    if (format === "csv") {
      const csv = toCsv(headers, outRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
        },
      });
    }
    const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
    const buf = buildXlsxBuffer("Filiais", headers, xlsxRows);
    return new NextResponse(asArrayBuffer(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
      },
    });
  }

  if (datasetRaw === "imoveis") {
    const createdAt = rangeWhere(from, to);
    const rows = await prisma.property.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        active: true,
        code: true,
        name: true,
        kind: true,
        status: true,
        city: true,
        state: true,
        rentSuggestedCents: true,
        branch: { select: { code: true, name: true } },
      },
    });
    const headers = [
      "criado_em",
      "ativo",
      "codigo",
      "nome",
      "tipo",
      "status",
      "cidade",
      "uf",
      "aluguel_sugerido_centavos",
      "filial_codigo",
      "filial_nome",
    ];
    const outRows = rows.map((r) => [
      r.createdAt.toISOString(),
      r.active ? "SIM" : "NAO",
      r.code ?? "",
      r.name,
      r.kind,
      r.status,
      r.city ?? "",
      r.state ?? "",
      r.rentSuggestedCents ?? 0,
      r.branch?.code ?? "",
      r.branch?.name ?? "",
    ]);

    if (format === "csv") {
      const csv = toCsv(headers, outRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
        },
      });
    }
    const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
    const buf = buildXlsxBuffer("Imoveis", headers, xlsxRows);
    return new NextResponse(asArrayBuffer(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
      },
    });
  }

  if (datasetRaw === "estacionamentos") {
    const createdAt = rangeWhere(from, to);
    const rows = await prisma.parkingFacility.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        status: true,
        code: true,
        name: true,
        addressLabel: true,
        capacityCars: true,
        capacityMotorcycles: true,
        notes: true,
        branch: { select: { code: true, name: true } },
      },
    });
    const headers = [
      "criado_em",
      "status",
      "codigo",
      "nome",
      "endereco",
      "capacidade_carros",
      "capacidade_motos",
      "observacoes",
      "filial_codigo",
      "filial_nome",
    ];
    const outRows = rows.map((r) => [
      r.createdAt.toISOString(),
      r.status,
      r.code ?? "",
      r.name,
      r.addressLabel ?? "",
      r.capacityCars ?? 0,
      r.capacityMotorcycles ?? 0,
      r.notes ?? "",
      r.branch?.code ?? "",
      r.branch?.name ?? "",
    ]);

    if (format === "csv") {
      const csv = toCsv(headers, outRows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
        },
      });
    }
    const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
    const buf = buildXlsxBuffer("Estacionamentos", headers, xlsxRows);
    return new NextResponse(asArrayBuffer(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
      },
    });
  }

  // estoque-itens (opcional: category=CLEANING|SCHOOL_SUPPLIES|BUILDING_MAINTENANCE)
  const cat = (url.searchParams.get("category") ?? "").trim();
  const category = cat && ["CLEANING", "SCHOOL_SUPPLIES", "BUILDING_MAINTENANCE"].includes(cat) ? (cat as any) : null;
  const createdAt = rangeWhere(from, to);
  const rows = await prisma.inventoryItem.findMany({
    where: {
      ...(createdAt ? { createdAt } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      category: true,
      sku: true,
      name: true,
      productCategory: true,
      brand: true,
      quantity: true,
      minQuantity: true,
      unit: true,
      location: true,
      unitPriceCents: true,
    },
  });
  const headers = [
    "criado_em",
    "categoria",
    "sku",
    "nome",
    "classificacao",
    "marca",
    "quantidade",
    "minimo",
    "unidade",
    "local",
    "preco_unit_centavos",
  ];
  const outRows = rows.map((r) => [
    r.createdAt.toISOString(),
    r.category,
    r.sku ?? "",
    r.name,
    r.productCategory ?? "",
    r.brand ?? "",
    r.quantity,
    r.minQuantity,
    r.unit,
    r.location ?? "",
    r.unitPriceCents,
  ]);

  if (format === "csv") {
    const csv = toCsv(headers, outRows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${baseName}.csv\"`,
      },
    });
  }
  const xlsxRows = outRows.map((r) => r.map((x) => (typeof x === "number" ? x : String(x))));
  const buf = buildXlsxBuffer("Estoque", headers, xlsxRows);
  return new NextResponse(asArrayBuffer(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=\"${baseName}.xlsx\"`,
    },
  });
}

