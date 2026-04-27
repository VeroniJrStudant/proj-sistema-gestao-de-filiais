"use client";

import { type ReactNode, useState } from "react";
import { CadastroEdicaoCollapsible } from "@/components/cadastro-edicao-collapsible";
import type { UserEditInitial } from "./users-edit-form";
import { UsersCreateForm } from "./users-create-form";
import { UsersEditForm } from "./users-edit-form";
import { UserSearchPanel, type UserPickerRow } from "./user-search-panel";

type Props = {
  effectiveUsuarioId: string | null;
  revealFichaFromParams: boolean;
  initialCadastroOpen: boolean;
  header: ReactNode;
  users: UserPickerRow[];
  editInitial: UserEditInitial | null;
  createFormListKey: string;
};

export function UsuariosPageShell({
  effectiveUsuarioId,
  revealFichaFromParams,
  initialCadastroOpen,
  header,
  users,
  editInitial,
  createFormListKey,
}: Props) {
  const [cadastroOpen, setCadastroOpen] = useState(initialCadastroOpen);
  const showHeader =
    revealFichaFromParams || (!effectiveUsuarioId && cadastroOpen);
  const fichaBelowList =
    Boolean(effectiveUsuarioId) && revealFichaFromParams && showHeader;
  const fichaBelowSearchOnly = showHeader && !effectiveUsuarioId;
  const fichaPanelOpen = Boolean(effectiveUsuarioId && revealFichaFromParams);

  return (
    <>
      <div className="mt-0 pt-1 sm:pt-2">
        <UserSearchPanel
          users={users}
          currentUserId={effectiveUsuarioId}
          fichaPanelOpen={fichaPanelOpen}
          belowSelectedFicha={fichaBelowList ? header : null}
        />
      </div>

      {fichaBelowSearchOnly ? <div className="mt-6">{header}</div> : null}

      <CadastroEdicaoCollapsible
        open={cadastroOpen}
        onOpenChange={setCadastroOpen}
        showLabel="Cadastrar ou editar usuário"
        hideLabel="Ocultar cadastro e edição"
        heading={
          <div>
            <h2 className="text-lg font-semibold text-ink">Cadastro e edição</h2>
            <p className="mt-1 text-sm text-muted">
              Com um usuário selecionado na lista, altere dados e permissões abaixo e salve. Para nova conta, use o
              formulário de cadastro (senha e 2FA opcional). Na ficha: redefinir senha por e-mail e ativar/inativar.
            </p>
          </div>
        }
      >
        {editInitial ? (
          <UsersEditForm key={`${editInitial.id}:${editInitial.updatedAt}`} user={editInitial} />
        ) : (
          <UsersCreateForm key={createFormListKey} />
        )}
      </CadastroEdicaoCollapsible>
    </>
  );
}
