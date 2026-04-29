import { DashboardGrid } from "@/components/dashboard-grid";
import { getDashboardSnapshot } from "@/lib/dashboard-stats";

export const dynamic = "force-dynamic";

function empty(v: string | string[] | undefined): string {
  return typeof v === "string" ? v.trim() : "";
}

function asParamList(v: string | string[] | undefined): string | string[] | undefined {
  if (v === undefined) return undefined;
  return v;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const data = await getDashboardSnapshot({
    biDe: empty(sp.bi_de),
    biAte: empty(sp.bi_ate),
    biScope: empty(sp.bi_scope),
    biVinculo: empty(sp.bi_vinculo),
    biFilial: asParamList(sp.bi_filial),
    biImovel: asParamList(sp.bi_imovel),
    biEstacionamento: asParamList(sp.bi_estacionamento),
    biServico: asParamList(sp.bi_servico),
  });
  return <DashboardGrid data={data} />;
}
