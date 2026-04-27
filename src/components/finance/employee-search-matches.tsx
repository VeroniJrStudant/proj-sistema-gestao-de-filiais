"use client";

import {
  describeWhyEmployeeMatched,
  employeeMatchesSearchQuery,
  type FinanceEmployeeSearchRow,
} from "@/lib/finance/student-search";
import { useMemo } from "react";

export function EmployeeSearchMatches({
  employees,
  query,
  onSelect,
}: {
  employees: FinanceEmployeeSearchRow[];
  query: string;
  onSelect?: (row: FinanceEmployeeSearchRow, searchQuery: string) => void;
}) {
  const matched = useMemo(
    () => employees.filter((e) => employeeMatchesSearchQuery(e, query)),
    [employees, query],
  );

  if (!query.trim() || matched.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-line-soft bg-elevated px-3 py-2 text-xs text-ink">
      <p className="font-medium text-ink">Funcionários</p>
      <p className="mt-0.5 text-muted">
        Toque para usar nome, e-mail e documento do cadastro do funcionário (sem vínculo com aluno).
      </p>
      <ul className="mt-2 max-h-40 divide-y divide-line-soft overflow-y-auto rounded-md border border-line-soft bg-elevated-2">
        {matched.slice(0, 20).map((e) => {
          const why = describeWhyEmployeeMatched(e, query);
          return (
            <li key={e.id}>
              {onSelect ? (
                <button
                  type="button"
                  className="w-full px-2 py-2 text-left transition-colors hover:bg-accent-soft"
                  onClick={() => onSelect(e, query)}
                >
                  <span className="font-medium text-ink">{e.name}</span>
                  {e.employeeCode?.trim() ? (
                    <span className="text-muted"> — mat. func. {e.employeeCode.trim()}</span>
                  ) : null}
                  {e.jobRole?.trim() ? (
                    <span className="mt-0.5 block text-subtle">{e.jobRole.trim()}</span>
                  ) : null}
                  {why ? (
                    <span className="mt-1 block text-[11px] font-medium text-accent-muted">
                      Corresponde à busca: {why}
                    </span>
                  ) : null}
                </button>
              ) : (
                <div className="px-2 py-2">
                  <span className="font-medium text-ink">{e.name}</span>
                  {e.employeeCode?.trim() ? (
                    <span className="text-muted"> — mat. func. {e.employeeCode.trim()}</span>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {matched.length > 20 ? (
        <p className="mt-1 text-subtle">E mais {matched.length - 20}… refine a busca.</p>
      ) : null}
    </div>
  );
}
