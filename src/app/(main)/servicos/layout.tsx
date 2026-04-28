import { ModuleGate } from "@/components/module-gate";

export default function ServicosLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleGate id="leases">
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 sm:space-y-8">{children}</div>
    </ModuleGate>
  );
}
