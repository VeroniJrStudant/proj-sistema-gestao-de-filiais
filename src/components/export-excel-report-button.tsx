"use client";

const btnClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-accent-border bg-accent-soft px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80 disabled:cursor-not-allowed disabled:opacity-50";

export function ExportExcelReportButton({
  onExport,
  disabled,
  className = "",
}: {
  onExport: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type="button" onClick={onExport} disabled={disabled} className={`${btnClass} ${className}`}>
      Extrair relatório em Excel
    </button>
  );
}
