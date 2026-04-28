"use client";

import { useEffect, useState } from "react";
import {
  OPERATION_LINK_KIND,
  OPERATION_LINK_KIND_UI_OPTIONS,
  type OperationLinkKind,
} from "./operation-link-kind-ui";

export type OperationEntityOption = { id: string; label: string };

function optionsForKind(
  kind: OperationLinkKind,
  props: {
    branches: OperationEntityOption[];
    properties: OperationEntityOption[];
    parkingFacilities: OperationEntityOption[];
  },
): OperationEntityOption[] {
  switch (kind) {
    case OPERATION_LINK_KIND.BRANCH:
      return props.branches;
    case OPERATION_LINK_KIND.PROPERTY:
      return props.properties;
    case OPERATION_LINK_KIND.PARKING_FACILITY:
      return props.parkingFacilities;
    default:
      return [];
  }
}

export function CustomerOperationLinkFields(props: {
  branches: OperationEntityOption[];
  properties: OperationEntityOption[];
  parkingFacilities: OperationEntityOption[];
  defaultKind: OperationLinkKind;
  defaultEntityId: string;
}) {
  const [kind, setKind] = useState<OperationLinkKind>(props.defaultKind);
  const [entityId, setEntityId] = useState(() =>
    props.defaultKind === OPERATION_LINK_KIND.NONE ? "" : props.defaultEntityId,
  );

  useEffect(() => {
    if (kind === OPERATION_LINK_KIND.NONE) {
      setEntityId("");
      return;
    }
    setEntityId((prev) => {
      const opts = optionsForKind(kind, props);
      if (opts.some((o) => o.id === prev)) return prev;
      return opts[0]?.id ?? "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage ao tipo; listas vêm do servidor por requisição
  }, [kind]);

  return (
    <div className="space-y-3 sm:col-span-2">
      <input type="hidden" name="operationLinkKind" value={kind} />
      <input
        type="hidden"
        name="operationEntityId"
        value={kind === OPERATION_LINK_KIND.NONE ? "" : entityId}
      />
      <div className="rounded-xl border border-line-soft bg-shell/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-muted">Vínculo com Operações</p>
        <p className="mt-1 text-[11px] text-muted">
          Escolha o tipo (como no menu Operações) e depois o cadastro específico, ou &quot;Nenhum&quot; para cliente
          geral.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="block text-xs font-medium text-muted">Tipo de cadastro</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as OperationLinkKind)}
              className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {OPERATION_LINK_KIND_UI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {kind !== OPERATION_LINK_KIND.NONE ? (
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-muted">Cadastro vinculado *</span>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="mt-1 w-full cursor-pointer rounded-lg border border-line bg-shell px-3 py-2 text-sm text-ink shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {optionsForKind(kind, props).length === 0 ? (
                  <option value="">— Nenhum cadastro disponível —</option>
                ) : (
                  optionsForKind(kind, props).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))
                )}
              </select>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
