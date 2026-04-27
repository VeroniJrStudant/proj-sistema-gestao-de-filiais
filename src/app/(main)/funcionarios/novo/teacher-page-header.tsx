"use client";

import Link from "next/link";
import { useId } from "react";
import { useOptionalTeacherFichaHeader } from "./teacher-ficha-header-context";
import { useTeacherPhoto } from "./teacher-photo-context";

type Props = {
  funcionarioId: string | null;
  savedPhotoUrl: string | null;
  savedName: string | null;
  savedNickname: string | null;
  /** Função/cargo cadastrado (ex.: professora, auxiliar). */
  savedJobRole: string | null;
  savedEmployeeCode: string | null;
  /** Quando há funcionário na URL. */
  fichaActive?: boolean;
};

export function TeacherPageHeader({
  funcionarioId,
  savedPhotoUrl,
  savedName,
  savedNickname,
  savedJobRole,
  savedEmployeeCode,
  fichaActive,
}: Props) {
  const fileInputId = useId();
  const { teacherPhoto, setTeacherPhoto, draftPreviewUrl } = useTeacherPhoto();
  const fichaCtx = useOptionalTeacherFichaHeader();

  const src = draftPreviewUrl ?? savedPhotoUrl ?? null;
  const label =
    savedName?.trim() ||
    (teacherPhoto || draftPreviewUrl ? "Prévia da foto" : "Foto do(a) funcionário(a)");

  const draftName = fichaCtx?.draftName?.trim() ?? "";
  const draftNick = fichaCtx?.draftNickname?.trim() ?? "";
  const draftJob = fichaCtx?.draftJobRole?.trim() ?? "";
  const draftCode = fichaCtx?.draftEmployeeCodeLine?.trim() ?? "";

  const employeeCodeDisplay =
    savedEmployeeCode?.trim() || draftCode || "—";
  const codePlaceholder = employeeCodeDisplay === "—";
  const displayName = savedName?.trim() || draftName || "";
  const displayNickname = savedNickname?.trim() || draftNick || "";
  const displayJobRole = savedJobRole?.trim() || draftJob || "";

  const showStatusCard =
    funcionarioId != null && fichaActive !== undefined;

  return (
    <header className="relative w-full max-w-none overflow-hidden rounded-2xl border border-line bg-elevated-2 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8 lg:gap-12">
        <div className="min-w-0 w-full flex-1">
          <div
            className="w-full rounded-xl border border-accent-border/60 bg-accent-soft/50 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4"
            aria-label="Ficha do funcionário"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">
              Ficha do(a) funcionário(a)
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-8 sm:gap-y-3">
              <div className="min-w-0 shrink-0 sm:max-w-[11rem]">
                <span className="text-xs font-medium text-muted">Código de registro</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex min-h-11 min-w-11 max-w-[10rem] shrink-0 items-center justify-center rounded-xl px-2.5 text-sm font-bold tabular-nums leading-tight shadow-sm ${
                      codePlaceholder
                        ? "border border-line bg-elevated-2 text-muted"
                        : "bg-accent text-on-accent"
                    }`}
                    title={codePlaceholder ? undefined : employeeCodeDisplay}
                  >
                    {employeeCodeDisplay}
                  </span>
                  {codePlaceholder ? (
                    <span className="text-sm font-medium leading-snug text-subtle">
                      Definido ao salvar ou no formulário
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 flex-1 border-t border-line-soft pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
                <span className="text-xs font-medium text-muted">Nome</span>
                <p
                  className={`mt-1 break-words text-lg font-semibold leading-snug tracking-tight sm:text-xl ${
                    displayName ? "text-ink" : "text-subtle"
                  }`}
                >
                  {displayName || "Preencha o nome no formulário"}
                </p>
                {displayNickname ? (
                  <p className="mt-1 text-sm text-muted">
                    Apelido: <span className="font-medium text-ink">{displayNickname}</span>
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-muted">
                  Função:{" "}
                  <span className={`font-medium ${displayJobRole ? "text-ink" : "text-subtle"}`}>
                    {displayJobRole || "—"}
                  </span>
                </p>
              </div>
            </div>
            {funcionarioId ? (
              <div className="border-t border-line-soft pt-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href={`/funcionarios/novo?funcionario=${encodeURIComponent(funcionarioId)}&cadastro=1`}
                    scroll={false}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent-border bg-accent-soft px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-accent-soft/80"
                    title="Abrir cadastro para editar telefone e demais dados"
                    onClick={() => {
                      window.dispatchEvent(new Event("open-cadastro-edicao"));
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-accent-muted"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Atualizar cadastro
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {showStatusCard ? (
            <div
              className="mt-4 rounded-xl border border-line-soft bg-shell/60 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4"
              aria-label="Situação do cadastro"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Situação
              </p>
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    fichaActive
                      ? "border border-success-border bg-success-bg text-success-fg"
                      : "border border-line-soft bg-elevated text-muted"
                  }`}
                >
                  {fichaActive ? "Ativo no sistema" : "Inativo"}
                </span>
              </div>
            </div>
          ) : null}

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Cadastrar funcionário(a)
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Registre dados de contato, função e vínculo com a unidade. O código de registro pode ser gerado
            automaticamente (prefixo P + ano) ou informado manualmente.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">
              Nome completo obrigatório
            </li>
            <li className="rounded-full border border-line-soft bg-shell px-3 py-1">
              Fotos JPG, PNG ou WebP
            </li>
          </ul>
        </div>

        <div className="ml-auto flex w-full max-w-[min(100%,280px)] shrink-0 flex-row items-center justify-end gap-4 sm:ml-0 sm:w-auto sm:max-w-none sm:flex-col sm:items-end sm:self-start">
          <div className="flex flex-col items-end gap-2">
            <input
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => setTeacherPhoto(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor={fileInputId}
              className={`group relative block h-[104px] w-[104px] shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-elevated shadow-sm ring-2 ring-offset-2 ring-offset-elevated-2 transition hover:ring-accent/40 ${
                src ? "ring-accent/35" : "ring-line"
              }`}
            >
              <figure className="m-0 h-full w-full">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL local ou blob
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span
                    className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center"
                    aria-hidden
                  >
                    <svg
                      className="h-10 w-10 text-subtle transition group-hover:text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.25}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-[10px] font-medium leading-tight text-subtle group-hover:text-muted">
                      Sem foto · toque para incluir
                    </span>
                  </span>
                )}
                <figcaption className="sr-only">{label}</figcaption>
              </figure>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/55 py-1 text-center text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
                aria-hidden
              >
                Escolher foto
              </span>
            </label>

            {teacherPhoto ? (
              <button
                type="button"
                className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
                onClick={() => setTeacherPhoto(null)}
              >
                Remover foto escolhida
              </button>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
}
