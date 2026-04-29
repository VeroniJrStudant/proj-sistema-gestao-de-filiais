import "server-only";
import {
  CameraStatus,
  FinancialDirection,
  FinancialKind,
  FinancialStatus,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const BI_CHART_ROW_CAP = 10_000;

export type BiChartTimelinePoint = {
  key: string;
  label: string;
  inCents: number;
  outCents: number;
  netCents: number;
};

export type BiChartKindSlice = {
  kind: string;
  label: string;
  inCents: number;
  outCents: number;
};

export type BiChartStatusSlice = {
  status: string;
  label: string;
  count: number;
  sumCents: number;
};

export type BiChartsPayload = {
  timeline: BiChartTimelinePoint[];
  byKind: BiChartKindSlice[];
  byStatus: BiChartStatusSlice[];
  recordCount: number;
  truncated: boolean;
};

/** Escopo do BI sobre lançamentos financeiros (tipo de vínculo + seleção opcional de entidades). */
export type BiOperacaoScope = "todas" | "sem_vinculo" | "filial" | "imovel" | "estacionamento" | "servico";

/** @deprecated use BiOperacaoScope */
export type BiVinculoOperacao = Exclude<BiOperacaoScope, "servico">;

export type BiFilterOptionBranch = { id: string; name: string };
export type BiFilterOptionProperty = { id: string; name: string };
export type BiFilterOptionParking = { id: string; name: string };
export type BiFilterOptionParticularService = { id: string; label: string };

export type DashboardSnapshotInput = {
  biDe?: string;
  biAte?: string;
  /** Preferência sobre `bi_vinculo` legado. */
  biScope?: string;
  /** @deprecated use `bi_scope` + listas; valores: todas, filial, imovel, estacionamento, sem_vinculo */
  biVinculo?: string;
  biFilial?: string | string[];
  biImovel?: string | string[];
  biEstacionamento?: string | string[];
  biServico?: string | string[];
};

export type DashboardSnapshot = {
  attendance: { recordsToday: number; presentToday: number };
  stock: {
    totalItems: number;
    lowStock: number;
    byCategory: Record<string, number>;
    lowByCategory: Record<string, number>;
  };
  cameras: { total: number; online: number };
  finance: {
    pendingInCents: number;
    settledMonthInCents: number;
    openBoletos: number;
    openPix: number;
    currentMonthInCents: number;
    currentMonthOutCents: number;
    monthlyFlow: {
      month: string;
      inCents: number;
      outCents: number;
    }[];
  };
  bi: {
    filters: {
      de: string;
      ate: string;
      scope: BiOperacaoScope;
      branchIds: string[];
      propertyIds: string[];
      parkingIds: string[];
      particularServiceIds: string[];
      filterOptions: {
        branches: BiFilterOptionBranch[];
        properties: BiFilterOptionProperty[];
        parkings: BiFilterOptionParking[];
        particularServices: BiFilterOptionParticularService[];
      };
    };
    finance: {
      periodInCents: number;
      periodOutCents: number;
      periodNetCents: number;
      overdueInCents: number;
      pendingOutCents: number;
      settledRatePct: number;
    };
    admin: {
      usersActive: number;
      customersActive: number;
      suppliersActive: number;
      branchesActive: number;
      propertiesActive: number;
      parkingActive: number;
      stockHealthPct: number;
      camerasOnlinePct: number;
    };
    charts: BiChartsPayload;
  };
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
}

function parseIdListParam(raw: string | string[] | undefined): string[] {
  if (raw == null) return [];
  const chunks = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const chunk of chunks) {
    for (const part of chunk.split(",")) {
      const t = part.trim();
      if (t) out.push(t);
    }
  }
  return [...new Set(out)];
}

function parseBiOperacaoScope(biScope: string | undefined, legacyBiVinculo: string | undefined): BiOperacaoScope {
  const s = (biScope ?? "").trim().toLowerCase();
  if (s === "todas" || s === "sem_vinculo" || s === "filial" || s === "imovel" || s === "estacionamento" || s === "servico") {
    return s;
  }
  const legacy = (legacyBiVinculo ?? "").trim().toLowerCase();
  if (legacy === "filial" || legacy === "imovel" || legacy === "estacionamento" || legacy === "sem_vinculo") {
    return legacy;
  }
  return "todas";
}

type BiEntitySelection = {
  branchIds: string[];
  propertyIds: string[];
  parkingIds: string[];
  particularServiceIds: string[];
};

function biOperacaoWhere(scope: BiOperacaoScope, sel: BiEntitySelection): Prisma.FinancialRecordWhereInput {
  switch (scope) {
    case "filial":
      if (sel.branchIds.length > 0) return { branchId: { in: sel.branchIds } };
      return { branchId: { not: null } };
    case "imovel":
      if (sel.propertyIds.length > 0) return { propertyId: { in: sel.propertyIds } };
      return { propertyId: { not: null } };
    case "estacionamento":
      if (sel.parkingIds.length > 0) return { parkingFacilityId: { in: sel.parkingIds } };
      return { parkingFacilityId: { not: null } };
    case "servico":
      if (sel.particularServiceIds.length > 0) return { particularServiceId: { in: sel.particularServiceIds } };
      return { particularServiceId: { not: null } };
    case "sem_vinculo":
      return {
        branchId: null,
        propertyId: null,
        parkingFacilityId: null,
        particularServiceId: null,
      };
    default:
      return {};
  }
}

function startOfDayFromYmd(ymd: string): Date | null {
  const t = ymd.trim();
  if (!t) return null;
  const d = new Date(`${t}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMondayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = (dow + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function monthKeyLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function kindLabelPt(kind: string): string {
  switch (kind) {
    case "TUITION":
      return "Mensalidade";
    case "PAYMENT":
      return "Pagamento";
    case "PIX":
      return "PIX";
    case "BOLETO":
      return "Boleto";
    case "RECEIPT":
      return "Recibo";
    case "DEBIT":
      return "Débito";
    case "DEPOSIT":
      return "Depósito";
    case "RENT":
      return "Aluguel";
    case "PARKING":
      return "Estacionamento";
    case "OTHER":
      return "Outro";
    default:
      return kind;
  }
}

function statusLabelPt(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "SETTLED":
      return "Liquidado";
    case "CANCELLED":
      return "Cancelado";
    case "OVERDUE":
      return "Em atraso";
    default:
      return status;
  }
}

function buildBiChartsPayload(
  rows: {
    createdAt: Date;
    direction: FinancialDirection;
    amountCents: number;
    kind: FinancialKind;
    status: FinancialStatus;
  }[],
  rangeFrom: Date,
  rangeToExclusive: Date,
): BiChartsPayload {
  const truncated = rows.length === BI_CHART_ROW_CAP;
  const spanMs = Math.max(rangeToExclusive.getTime() - rangeFrom.getTime(), 86400000);
  const spanDays = Math.ceil(spanMs / 86400000);
  const bucket: "day" | "week" | "month" =
    spanDays <= 45 ? "day" : spanDays <= 180 ? "week" : "month";

  const agg = new Map<string, { inCents: number; outCents: number }>();

  function bump(key: string, direction: FinancialDirection, cents: number) {
    const cur = agg.get(key) ?? { inCents: 0, outCents: 0 };
    if (direction === FinancialDirection.IN) cur.inCents += cents;
    else cur.outCents += cents;
    agg.set(key, cur);
  }

  for (const r of rows) {
    const d = r.createdAt;
    let key: string;
    if (bucket === "day") {
      key = ymdLocal(d);
    } else if (bucket === "week") {
      key = ymdLocal(startOfWeekMondayLocal(d));
    } else {
      key = monthKeyLocal(d);
    }
    bump(key, r.direction, r.amountCents);
  }

  const timeline: BiChartTimelinePoint[] = [];
  if (bucket === "day") {
    for (let d = new Date(rangeFrom); d < rangeToExclusive; d = addDays(d, 1)) {
      const key = ymdLocal(d);
      const v = agg.get(key) ?? { inCents: 0, outCents: 0 };
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      timeline.push({
        key,
        label,
        inCents: v.inCents,
        outCents: v.outCents,
        netCents: v.inCents - v.outCents,
      });
    }
  } else if (bucket === "week") {
    for (let d = startOfWeekMondayLocal(rangeFrom); d < rangeToExclusive; d = addDays(d, 7)) {
      const key = ymdLocal(d);
      const v = agg.get(key) ?? { inCents: 0, outCents: 0 };
      const label = `Sem ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
      timeline.push({
        key,
        label,
        inCents: v.inCents,
        outCents: v.outCents,
        netCents: v.inCents - v.outCents,
      });
    }
  } else {
    const start = new Date(rangeFrom.getFullYear(), rangeFrom.getMonth(), 1);
    const lastInclusive = new Date(rangeToExclusive.getTime() - 1);
    const end = new Date(lastInclusive.getFullYear(), lastInclusive.getMonth() + 1, 1);
    for (let d = new Date(start); d < end; d.setMonth(d.getMonth() + 1)) {
      const key = monthKeyLocal(d);
      const v = agg.get(key) ?? { inCents: 0, outCents: 0 };
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
      timeline.push({
        key,
        label,
        inCents: v.inCents,
        outCents: v.outCents,
        netCents: v.inCents - v.outCents,
      });
    }
  }

  const kindMap = new Map<string, { inCents: number; outCents: number }>();
  for (const r of rows) {
    const k = r.kind;
    const cur = kindMap.get(k) ?? { inCents: 0, outCents: 0 };
    if (r.direction === FinancialDirection.IN) cur.inCents += r.amountCents;
    else cur.outCents += r.amountCents;
    kindMap.set(k, cur);
  }
  const byKind: BiChartKindSlice[] = [...kindMap.entries()]
    .map(([kind, v]) => ({
      kind,
      label: kindLabelPt(kind),
      inCents: v.inCents,
      outCents: v.outCents,
    }))
    .sort((a, b) => b.inCents + b.outCents - (a.inCents + a.outCents))
    .slice(0, 10);

  const stMap = new Map<string, { count: number; sumCents: number }>();
  for (const r of rows) {
    const s = r.status;
    const cur = stMap.get(s) ?? { count: 0, sumCents: 0 };
    cur.count += 1;
    cur.sumCents += r.amountCents;
    stMap.set(s, cur);
  }
  const byStatus: BiChartStatusSlice[] = [...stMap.entries()]
    .map(([status, v]) => ({
      status,
      label: statusLabelPt(status),
      count: v.count,
      sumCents: v.sumCents,
    }))
    .sort((a, b) => b.sumCents - a.sumCents);

  return {
    timeline: timeline.length > 0 ? timeline : [{ key: "0", label: "Sem dados", inCents: 0, outCents: 0, netCents: 0 }],
    byKind,
    byStatus,
    recordCount: rows.length,
    truncated,
  };
}

export async function getDashboardSnapshot(input?: DashboardSnapshotInput): Promise<DashboardSnapshot> {
  const today = startOfToday();
  const tomorrow = new Date(today.getTime() + 86400000);
  const monthStart = startOfMonth();
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const yearStart = startOfYear();
  const yearEnd = new Date(yearStart);
  yearEnd.setFullYear(yearEnd.getFullYear() + 1);

  const scope = parseBiOperacaoScope(input?.biScope, input?.biVinculo);
  const branchIds = parseIdListParam(input?.biFilial);
  const propertyIds = parseIdListParam(input?.biImovel);
  const parkingIds = parseIdListParam(input?.biEstacionamento);
  const particularServiceIds = parseIdListParam(input?.biServico);
  const entitySel: BiEntitySelection = { branchIds, propertyIds, parkingIds, particularServiceIds };

  const deParsed = startOfDayFromYmd(input?.biDe ?? "");
  const ateParsed = startOfDayFromYmd(input?.biAte ?? "");
  let biFrom = deParsed ?? monthStart;
  let biToExclusive = ateParsed ? addDays(ateParsed, 1) : tomorrow;
  if (biToExclusive.getTime() <= biFrom.getTime()) {
    biFrom = monthStart;
    biToExclusive = tomorrow;
  }
  const biDeStr = (input?.biDe ?? "").trim() || biFrom.toISOString().slice(0, 10);
  const biAteStr = (input?.biAte ?? "").trim() || addDays(biToExclusive, -1).toISOString().slice(0, 10);

  const biVWhere = biOperacaoWhere(scope, entitySel);
  const biPeriodWhere: Prisma.FinancialRecordWhereInput = {
    ...biVWhere,
    createdAt: { gte: biFrom, lt: biToExclusive },
    status: { not: FinancialStatus.CANCELLED },
  };
  const biOverdueWhere: Prisma.FinancialRecordWhereInput = {
    ...biVWhere,
    direction: FinancialDirection.IN,
    status: FinancialStatus.PENDING,
    dueDate: { lt: today },
  };
  const biPendingOutWhere: Prisma.FinancialRecordWhereInput = {
    ...biVWhere,
    direction: FinancialDirection.OUT,
    status: FinancialStatus.PENDING,
  };

  const [
    attendanceToday,
    presentToday,
    inventoryItems,
    cameras,
    pendingIn,
    settledMonth,
    monthIn,
    monthOut,
    overdueIn,
    pendingOut,
    settledCountMonth,
    totalCountMonth,
    biPeriodIn,
    biPeriodOut,
    biOverdueIn,
    biPendingOut,
    biSettledCountPeriod,
    biTotalCountPeriod,
    biChartRows,
    openBoletos,
    openPix,
    financialFlowYear,
    usersActive,
    customersActive,
    suppliersActive,
    branchesActive,
    propertiesActive,
    parkingActive,
    biFilterBranches,
    biFilterProperties,
    biFilterParkings,
    biFilterParticularServices,
  ] = await Promise.all([
    prisma.accessSession.count({
      where: { entryAt: { gte: today, lt: tomorrow } },
    }),
    prisma.accessSession.count({
      where: { status: "OPEN" },
    }),
    prisma.inventoryItem.findMany(),
    prisma.securityCamera.findMany(),
    prisma.financialRecord.aggregate({
      where: {
        direction: FinancialDirection.IN,
        status: FinancialStatus.PENDING,
      },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: {
        direction: FinancialDirection.IN,
        status: FinancialStatus.SETTLED,
        settledAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: {
        direction: FinancialDirection.IN,
        status: { not: FinancialStatus.CANCELLED },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: {
        direction: FinancialDirection.OUT,
        status: { not: FinancialStatus.CANCELLED },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: {
        direction: FinancialDirection.IN,
        status: FinancialStatus.PENDING,
        dueDate: { lt: today },
      },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: {
        direction: FinancialDirection.OUT,
        status: FinancialStatus.PENDING,
      },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.count({
      where: {
        status: FinancialStatus.SETTLED,
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.financialRecord.count({
      where: {
        status: { not: FinancialStatus.CANCELLED },
        createdAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.financialRecord.aggregate({
      where: { ...biPeriodWhere, direction: FinancialDirection.IN },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: { ...biPeriodWhere, direction: FinancialDirection.OUT },
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: biOverdueWhere,
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.aggregate({
      where: biPendingOutWhere,
      _sum: { amountCents: true },
    }),
    prisma.financialRecord.count({
      where: {
        ...biVWhere,
        status: FinancialStatus.SETTLED,
        createdAt: { gte: biFrom, lt: biToExclusive },
      },
    }),
    prisma.financialRecord.count({
      where: {
        ...biPeriodWhere,
      },
    }),
    prisma.financialRecord.findMany({
      where: biPeriodWhere,
      select: {
        createdAt: true,
        direction: true,
        amountCents: true,
        kind: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
      take: BI_CHART_ROW_CAP,
    }),
    prisma.financialRecord.count({
      where: {
        kind: FinancialKind.BOLETO,
        status: FinancialStatus.PENDING,
      },
    }),
    prisma.financialRecord.count({
      where: {
        kind: FinancialKind.PIX,
        status: FinancialStatus.PENDING,
      },
    }),
    prisma.financialRecord.findMany({
      where: {
        createdAt: { gte: yearStart, lt: yearEnd },
        status: { not: FinancialStatus.CANCELLED },
      },
      select: {
        createdAt: true,
        direction: true,
        amountCents: true,
      },
    }),
    prisma.userAccount.count({ where: { active: true } }),
    prisma.customer.count({ where: { active: true } }),
    prisma.supplier.count({ where: { active: true } }),
    prisma.branch.count({ where: { active: true } }),
    prisma.property.count({ where: { active: true } }),
    prisma.parkingFacility.count({ where: { status: "ACTIVE" } }),
    prisma.branch.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.property.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.parkingFacility.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.particularService.findMany({
      orderBy: { title: "asc" },
      take: 500,
      select: {
        id: true,
        title: true,
        serviceCatalog: { select: { name: true } },
      },
    }),
  ]);

  const lowStock = inventoryItems.filter((i) => i.quantity <= i.minQuantity).length;
  const byCategory: Record<string, number> = {};
  const lowByCategory: Record<string, number> = {};
  for (const i of inventoryItems) {
    byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
    if (i.quantity <= i.minQuantity) {
      lowByCategory[i.category] = (lowByCategory[i.category] ?? 0) + 1;
    }
  }

  const onlineCams = cameras.filter((c) => c.status === CameraStatus.ONLINE).length;
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const monthlyFlow = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(yearStart);
    d.setMonth(i);
    return { month: monthFormatter.format(d).replace(".", ""), inCents: 0, outCents: 0 };
  });
  for (const row of financialFlowYear) {
    const idx = row.createdAt.getMonth();
    if (!monthlyFlow[idx]) continue;
    if (row.direction === FinancialDirection.IN) monthlyFlow[idx].inCents += row.amountCents;
    else monthlyFlow[idx].outCents += row.amountCents;
  }

  const currentMonthInCents = monthIn._sum.amountCents ?? 0;
  const currentMonthOutCents = monthOut._sum.amountCents ?? 0;
  const currentMonthNetCents = currentMonthInCents - currentMonthOutCents;
  const overdueInCents = overdueIn._sum.amountCents ?? 0;
  const pendingOutCents = pendingOut._sum.amountCents ?? 0;
  const settledRatePct = totalCountMonth === 0 ? 0 : Math.round((settledCountMonth / totalCountMonth) * 100);

  const periodInCents = biPeriodIn._sum.amountCents ?? 0;
  const periodOutCents = biPeriodOut._sum.amountCents ?? 0;
  const periodNetCents = periodInCents - periodOutCents;
  const biOverdueInCents = biOverdueIn._sum.amountCents ?? 0;
  const biPendingOutCents = biPendingOut._sum.amountCents ?? 0;
  const biSettledRatePct =
    biTotalCountPeriod === 0 ? 0 : Math.round((biSettledCountPeriod / biTotalCountPeriod) * 100);
  const stockHealthPct =
    inventoryItems.length === 0 ? 100 : Math.max(0, Math.round(((inventoryItems.length - lowStock) / inventoryItems.length) * 100));
  const camerasOnlinePct = cameras.length === 0 ? 0 : Math.round((onlineCams / cameras.length) * 100);

  const biCharts = buildBiChartsPayload(biChartRows, biFrom, biToExclusive);

  const particularServicesOptions: BiFilterOptionParticularService[] = biFilterParticularServices.map((p) => {
    const cat = p.serviceCatalog?.name?.trim();
    const label = cat ? `${p.title.trim()} (${cat})` : p.title.trim();
    return { id: p.id, label };
  });

  return {
    attendance: { recordsToday: attendanceToday, presentToday },
    stock: { totalItems: inventoryItems.length, lowStock, byCategory, lowByCategory },
    cameras: { total: cameras.length, online: onlineCams },
    finance: {
      pendingInCents: pendingIn._sum.amountCents ?? 0,
      settledMonthInCents: settledMonth._sum.amountCents ?? 0,
      openBoletos,
      openPix,
      currentMonthInCents,
      currentMonthOutCents,
      monthlyFlow,
    },
    bi: {
      filters: {
        de: biDeStr,
        ate: biAteStr,
        scope,
        branchIds,
        propertyIds,
        parkingIds,
        particularServiceIds,
        filterOptions: {
          branches: biFilterBranches,
          properties: biFilterProperties,
          parkings: biFilterParkings,
          particularServices: particularServicesOptions,
        },
      },
      finance: {
        periodInCents,
        periodOutCents,
        periodNetCents,
        overdueInCents: biOverdueInCents,
        pendingOutCents: biPendingOutCents,
        settledRatePct: biSettledRatePct,
      },
      admin: {
        usersActive,
        customersActive,
        suppliersActive,
        branchesActive,
        propertiesActive,
        parkingActive,
        stockHealthPct,
        camerasOnlinePct,
      },
      charts: biCharts,
    },
  };
}
