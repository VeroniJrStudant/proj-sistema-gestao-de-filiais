import { formatBRL } from "@/lib/format-brl";

const kindLabels: Record<string, string> = {
  TUITION: "Mensalidade",
  PAYMENT: "Pagamento",
  PIX: "PIX",
  BOLETO: "Boleto",
  RECEIPT: "Recibo",
  DEBIT: "Débito / saída",
  DEPOSIT: "Depósito",
  OTHER: "Outro",
};

export type RecentFinancialRecordRow = {
  id: string;
  kind: string;
  direction: string;
  amountCents: number;
  description: string | null;
  status: string;
  dueDate: string | null;
  settledAt: string | null;
  externalRef: string | null;
  studentName: string | null;
};

export function RecentFinancialRecords({ rows }: { rows: RecentFinancialRecordRow[] }) {
  return (
    <section
      className="rounded-2xl border border-line-soft bg-elevated-2 px-4 py-4 shadow-sm sm:px-5"
      aria-label="Lançamentos financeiros recentes"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">
        Movimentação
      </p>
      <h2 className="mt-1 text-sm font-semibold text-ink">Lançamentos recentes</h2>
      <p className="mt-1 text-sm text-muted">
        Últimos registros de cobranças, pagamentos e outros lançamentos (até 50).
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nenhum lançamento cadastrado ainda.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const due = r.dueDate ? new Date(r.dueDate) : null;
            const settled = r.settledAt ? new Date(r.settledAt) : null;
            return (
              <li
                key={r.id}
                className="rounded-xl border border-line bg-elevated px-4 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">
                    {r.kind === "OTHER" && r.description?.startsWith("Documento de débito")
                      ? "Documento de débito"
                      : kindLabels[r.kind] ?? r.kind}
                    {r.direction === "OUT" && r.kind !== "DEBIT" ? " (saída)" : ""}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      r.direction === "IN" ? "text-accent-muted" : "text-muted"
                    }`}
                  >
                    {r.direction === "IN" ? "+" : "−"}
                    {formatBRL(r.amountCents)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {r.description ?? "—"} · {r.status}
                  {r.studentName ? ` · ${r.studentName}` : ""}
                </p>
                {(due || settled) && (
                  <p className="mt-1 text-xs text-subtle">
                    {due && `Venc. ${due.toLocaleDateString("pt-BR")}`}
                    {due && settled ? " · " : ""}
                    {settled && `Liquidado ${settled.toLocaleDateString("pt-BR")}`}
                  </p>
                )}
                {r.externalRef ? <p className="text-xs text-subtle">Ref: {r.externalRef}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
