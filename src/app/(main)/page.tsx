import { DashboardGrid } from "@/components/dashboard-grid";
import { getDashboardSnapshot } from "@/lib/dashboard-stats";

export default async function DashboardPage() {
  const data = await getDashboardSnapshot();
  return <DashboardGrid data={data} />;
}
