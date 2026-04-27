import { MuralBoard } from "@/components/mural-board";
import { getSession } from "@/lib/auth/session";
import { getMuralData } from "@/lib/mural-data";

export default async function MuralPage() {
  const session = await getSession();
  const role = session?.role ?? "STUDENT";
  const data = await getMuralData();
  return (
    <div className="mx-auto max-w-6xl">
      <MuralBoard data={data} role={role} />
    </div>
  );
}
