import "server-only";
import {
  CameraStatus,
  FinancialDirection,
  FinancialKind,
  FinancialStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

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

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const today = startOfToday();
  const tomorrow = new Date(today.getTime() + 86400000);
  const monthStart = startOfMonth();
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const [
    attendanceToday,
    presentToday,
    inventoryItems,
    cameras,
    pendingIn,
    settledMonth,
    openBoletos,
    openPix,
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

  return {
    attendance: { recordsToday: attendanceToday, presentToday },
    stock: { totalItems: inventoryItems.length, lowStock, byCategory, lowByCategory },
    cameras: { total: cameras.length, online: onlineCams },
    finance: {
      pendingInCents: pendingIn._sum.amountCents ?? 0,
      settledMonthInCents: settledMonth._sum.amountCents ?? 0,
      openBoletos,
      openPix,
    },
  };
}
