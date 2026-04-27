import { ModuleGate } from "@/components/module-gate";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { RegistroAcessoView } from "./registro-acesso-view";

export const dynamic = "force-dynamic";

export default async function PresencaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const canRecord =
    session !== null &&
    session.permissions.includes("attendance.access") &&
    (session.role === "ADMIN" || session.role === "TEACHER");

  const kind = typeof sp.tipo === "string" ? sp.tipo.trim() : "";
  const selectedParkingId = typeof sp.estacionamento === "string" ? sp.estacionamento.trim() : "";
  const selectedPropertyId = typeof sp.imovel === "string" ? sp.imovel.trim() : "";

  const [branches, properties, parkingFacilities, pricingPlans, sessions] = await Promise.all([
    prisma.branch.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.property.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.parkingFacility.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.accessPricingPlan.findMany({
      where: { active: true },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        kind: true,
        branchId: true,
        propertyId: true,
        parkingFacilityId: true,
        fractionMinutes: true,
        pricePerFractionCents: true,
        graceMinutes: true,
        dailyMaxCents: true,
        fixedPriceCents: true,
      },
    }),
    prisma.accessSession.findMany({
      where: {
        status: { in: ["OPEN", "CLOSED"] },
        ...(kind === "PARKING" || kind === "PROPERTY" ? { kind } : null),
        ...(selectedParkingId ? { parkingFacilityId: selectedParkingId } : null),
        ...(selectedPropertyId ? { propertyId: selectedPropertyId } : null),
      } as never,
      orderBy: [{ status: "asc" }, { entryAt: "desc" }],
      take: 200,
      select: {
        id: true,
        kind: true,
        status: true,
        branchId: true,
        propertyId: true,
        parkingFacilityId: true,
        plate: true,
        customerName: true,
        entryAt: true,
        exitAt: true,
        finalAmountCents: true,
        paidCents: true,
        note: true,
        pricingPlanId: true,
      },
    }),
  ]);

  return (
    <ModuleGate id="attendance">
      <RegistroAcessoView
        canRecord={canRecord}
        branches={branches}
        properties={properties}
        parkingFacilities={parkingFacilities}
        pricingPlans={pricingPlans}
        sessions={sessions}
      />
    </ModuleGate>
  );
}
