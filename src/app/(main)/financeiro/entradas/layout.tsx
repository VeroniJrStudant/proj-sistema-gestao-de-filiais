import type { ReactNode } from "react";
import { EntradasSubnav } from "./entradas-subnav";

export default function FinanceiroEntradasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <EntradasSubnav />
      {children}
    </div>
  );
}
