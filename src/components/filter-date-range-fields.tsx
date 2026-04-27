"use client";

const defaultInputClass =
  "mt-1 w-full rounded-lg border border-line bg-elevated-2 px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const defaultLabelClass = "block text-xs font-medium text-muted";

export function FilterDateRangeFields({
  idPrefix,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  inputClass = defaultInputClass,
  labelClass = defaultLabelClass,
  legend = "Período",
  className = "",
  fromColClass = "",
  toColClass = "",
}: {
  idPrefix: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  inputClass?: string;
  labelClass?: string;
  /** Rótulo do grupo (ex.: cadastro, ano letivo). */
  legend?: string;
  className?: string;
  fromColClass?: string;
  toColClass?: string;
}) {
  return (
    <div className={className}>
      <p className={`${labelClass} mb-1`}>{legend}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
        <div className={fromColClass}>
          <label className={labelClass} htmlFor={`${idPrefix}-de`}>
            De
          </label>
          <input
            id={`${idPrefix}-de`}
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className={toColClass}>
          <label className={labelClass} htmlFor={`${idPrefix}-ate`}>
            Até
          </label>
          <input
            id={`${idPrefix}-ate`}
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
