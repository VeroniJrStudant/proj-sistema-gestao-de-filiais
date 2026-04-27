import { DebitDocPrintBodyClass, PrintPageButton } from "@/components/debit-doc-print";
import { ModuleGate } from "@/components/module-gate";
import { formatBRL } from "@/lib/format-brl";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

function schoolDisplayName(): string {
  return process.env.SCHOOL_NAME?.trim() || process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || "Creche";
}

type DebitMeta = {
  channel?: string;
  debitNotice?: string;
  referenceLabel?: string;
  payerName?: string;
  payerDocument?: string;
  payerEmail?: string;
  notes?: string;
};

export default async function DocumentoDebitoPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await prisma.financialRecord.findUnique({
    where: { id },
    include: { student: { select: { name: true } } },
  });
  if (!record) notFound();

  let meta: DebitMeta;
  try {
    meta = JSON.parse(record.metadata ?? "{}") as DebitMeta;
  } catch {
    notFound();
  }
  if (meta.channel !== "DOCUMENTO_DEBITO" && meta.debitNotice !== "true") {
    notFound();
  }

  const unit = schoolDisplayName();
  const reference =
    meta.referenceLabel?.trim() ||
    record.description?.replace(/^Documento de débito —\s*/i, "").trim() ||
    "—";
  const due = record.dueDate ? new Date(record.dueDate).toLocaleDateString("pt-BR") : "—";
  const payer = meta.payerName?.trim() || "—";
  const doc = meta.payerDocument?.trim() || null;
  const email = meta.payerEmail?.trim() || null;
  const studentName = record.student?.name?.trim() ?? null;
  const notes = meta.notes?.trim() || null;

  return (
    <ModuleGate id="finance">
      <DebitDocPrintBodyClass className="debit-doc-print" />
      <div className="mx-auto min-w-0 max-w-2xl space-y-6 px-3 sm:px-4">
        <nav className="print:hidden text-sm text-muted">
          <Link href="/financeiro/pagamentos-pais" className="text-accent-muted underline decoration-dotted hover:text-accent">
            Pagamentos para famílias
          </Link>
          <span className="text-subtle"> · </span>
          <span className="text-ink">Documento de débito</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <PrintPageButton />
          <Link
            href="/financeiro/pagamentos-pais"
            className="text-sm font-medium text-accent-muted underline decoration-dotted hover:text-accent"
          >
            ← Voltar
          </Link>
        </div>

        <article
          className="rounded-2xl border border-line-soft bg-elevated-2 p-6 shadow-sm print:border-line print:bg-white print:shadow-none print:rounded-none"
          aria-label="Documento de débito"
        >
          <header className="border-b border-line-soft pb-4 text-center print:border-line">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{unit}</p>
            <h1 className="mt-2 text-xl font-semibold text-ink">Documento de débito</h1>
            <p className="mt-1 text-xs text-subtle">Ref. interna: {record.externalRef ?? record.id}</p>
          </header>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
              <dt className="text-muted">Referência</dt>
              <dd className="text-ink">{reference}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
              <dt className="text-muted">Valor</dt>
              <dd className="text-lg font-semibold text-ink">{formatBRL(record.amountCents)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
              <dt className="text-muted">Vencimento</dt>
              <dd className="text-ink">{due}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
              <dt className="text-muted">Responsável (pagador)</dt>
              <dd className="text-ink">{payer}</dd>
            </div>
            {doc ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
                <dt className="text-muted">CPF / CNPJ</dt>
                <dd className="text-ink">{doc}</dd>
              </div>
            ) : null}
            {email ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
                <dt className="text-muted">E-mail</dt>
                <dd className="text-ink">{email}</dd>
              </div>
            ) : null}
            {studentName ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
                <dt className="text-muted">Aluno(a)</dt>
                <dd className="text-ink">{studentName}</dd>
              </div>
            ) : null}
            {notes ? (
              <div className="grid gap-1 sm:grid-cols-[minmax(8rem,30%)_1fr] sm:gap-4">
                <dt className="text-muted">Observações (secretaria)</dt>
                <dd className="text-ink whitespace-pre-wrap">{notes}</dd>
              </div>
            ) : null}
          </dl>

          <footer className="mt-8 border-t border-line-soft pt-4 text-xs text-subtle print:border-line">
            <p>
              Este documento foi emitido pelo sistema da unidade para fins de cobrança e controle. O pagamento
              deve ser feito conforme combinado com a secretaria. Em caso de dúvida, procure a instituição.
            </p>
          </footer>
        </article>
      </div>
    </ModuleGate>
  );
}
