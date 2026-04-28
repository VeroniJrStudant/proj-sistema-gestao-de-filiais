import type { ReactNode } from "react";
import { SaidasSubnav } from "./saidas-subnav";

export default function FinanceiroSaidasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <SaidasSubnav />
      {children}
    </div>
  );
}
