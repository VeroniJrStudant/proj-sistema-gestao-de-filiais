import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { UserAccountHeader } from "./user-account-header";
import { UsuariosPageShell } from "./usuarios-page-shell";
import type { UserPickerRow } from "./user-search-panel";

export const dynamic = "force-dynamic";

type SearchParams = { usuario?: string; cadastro?: string; ficha?: string };

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.permissions.includes("users.manage")) {
    redirect("/");
  }

  const sp = await searchParams;
  const usuarioId = sp.usuario?.trim() ?? null;
  const revealFichaFromParams = sp.ficha === "1" || sp.cadastro === "1";
  const initialCadastroOpen = sp.cadastro === "1";

  const users = await prisma.userAccount.findMany({
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      displayName: true,
      email: true,
      loginName: true,
      profileRole: true,
      twoFactorEnabled: true,
      active: true,
      phone: true,
      document: true,
      permissionsJson: true,
      guardian: { select: { phone: true, document: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  const pickerRows: UserPickerRow[] = users.map((u) => ({
    id: u.id,
    displayName: u.displayName.trim(),
    email: u.email,
    loginName: u.loginName,
    profileRole: u.profileRole,
    active: u.active,
    twoFactorEnabled: u.twoFactorEnabled,
    phone: u.phone?.trim() || u.guardian?.phone?.trim() || null,
    document: u.document?.trim() || u.guardian?.document?.trim() || null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  const selectedRow = usuarioId ? users.find((u) => u.id === usuarioId) : null;
  const selectedHeader = selectedRow
    ? {
        id: selectedRow.id,
        displayName: selectedRow.displayName.trim(),
        email: selectedRow.email,
        loginName: selectedRow.loginName,
        profileRole: selectedRow.profileRole,
        active: selectedRow.active,
        twoFactorEnabled: selectedRow.twoFactorEnabled,
      }
    : null;

  const editInitial =
    selectedRow != null
      ? {
          id: selectedRow.id,
          displayName: selectedRow.displayName.trim(),
          email: selectedRow.email,
          loginName: selectedRow.loginName,
          profileRole: selectedRow.profileRole,
          phone: selectedRow.phone?.trim() || selectedRow.guardian?.phone?.trim() || "",
          document: selectedRow.document?.trim() || selectedRow.guardian?.document?.trim() || "",
          permissionsJson: selectedRow.permissionsJson,
          updatedAt: selectedRow.updatedAt.toISOString(),
        }
      : null;

  const listKey = users.map((u) => `${u.id}:${u.active ? "1" : "0"}:${u.updatedAt.toISOString()}`).join("|");

  const effectiveUsuarioId = selectedRow ? usuarioId : null;

  const shellLayoutKey = [
    effectiveUsuarioId ?? "novo",
    sp.cadastro ?? "",
    sp.ficha ?? "",
  ].join("|");

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-3 sm:px-4">
      <UsuariosPageShell
        key={shellLayoutKey}
        effectiveUsuarioId={effectiveUsuarioId}
        revealFichaFromParams={revealFichaFromParams}
        initialCadastroOpen={initialCadastroOpen}
        users={pickerRows}
        editInitial={editInitial}
        createFormListKey={listKey}
        header={<UserAccountHeader selected={selectedHeader} sessionUserId={session.sub} />}
      />
    </div>
  );
}
