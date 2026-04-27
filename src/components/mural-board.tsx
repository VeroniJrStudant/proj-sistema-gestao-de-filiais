import type { MuralBirthdayRow, MuralData } from "@/lib/mural-data";
import { MuralEventsPanel } from "@/components/mural-events-panel";

function BabyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" className="text-line" />
      <ellipse cx="24" cy="28" rx="10" ry="9" stroke="currentColor" strokeWidth="1.5" className="text-muted" />
      <path
        d="M16 20c0-5 3.5-9 8-9s8 4 8 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-muted"
      />
      <circle cx="19" cy="22" r="1.5" fill="currentColor" className="text-muted" />
      <circle cx="29" cy="22" r="1.5" fill="currentColor" className="text-muted" />
    </svg>
  );
}

function TeacherIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" className="text-line" />
      <path
        d="M24 14c-4 0-7 2.5-7 6v2h14v-2c0-3.5-3-6-7-6z"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted"
      />
      <path
        d="M14 28c0-4 4.5-7 10-7s10 3 10 7v3H14v-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted"
      />
    </svg>
  );
}

function BirthdayAvatar({ row }: { row: MuralBirthdayRow }) {
  if (row.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URLs dinâmicas do cadastro
      <img
        src={row.photoUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-line-soft"
      />
    );
  }
  return row.kind === "student" ? (
    <BabyIcon className="h-11 w-11 shrink-0 text-subtle" />
  ) : (
    <TeacherIcon className="h-11 w-11 shrink-0 text-subtle" />
  );
}

function BirthdayList({ rows }: { rows: MuralBirthdayRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Nenhum aniversariante cadastrado com data de nascimento neste período.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3" role="list">
      {rows.map((row) => (
        <li key={`${row.kind}-${row.id}`} className="flex gap-3">
          <BirthdayAvatar row={row} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-ink">{row.name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {row.dateLine}, {row.ageLine}
            </p>
            <span className="mt-1 inline-block rounded bg-panel px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-subtle">
              {row.roleLabel}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MuralCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-line-soft bg-elevated-2 p-5 shadow-sm ${className ?? ""}`}
    >
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

function EmptyInset({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-panel/60 px-4 py-6 text-center text-sm text-muted ring-1 ring-line-soft">
      {children}
    </div>
  );
}

export function MuralBoard({
  data,
  role,
}: {
  data: MuralData;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "LEGAL_GUARDIAN";
}) {
  return (
    <div className="relative">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Mural</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Aniversários do mês, próximos aniversários, medicamentos do dia e eventos da semana.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <MuralCard title="Aniversariantes do Mês" subtitle={data.monthTitle}>
          <BirthdayList rows={data.birthdaysThisMonth} />
        </MuralCard>

        <MuralCard title="Aniversariantes do Próximo Mês" subtitle={data.nextMonthTitle}>
          <BirthdayList rows={data.birthdaysNextMonth} />
        </MuralCard>

        <MuralCard title="Medicamentos de Hoje" subtitle={data.todayLabel} className="lg:col-span-2">
          <EmptyInset>Nenhum medicamento programado para hoje.</EmptyInset>
        </MuralCard>

        <MuralCard title="Eventos da Semana" subtitle={data.weekRangeLabel} className="lg:col-span-2">
          <MuralEventsPanel
            role={role}
            weekStartIso={data.weekStartIso}
            weekEndIso={data.weekEndIso}
            eventsThisWeek={data.eventsThisWeek}
            eventsThisMonth={data.eventsThisMonth}
          />
        </MuralCard>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm">
        <span className="font-semibold text-accent">Creche Gestão</span>
        <div className="flex gap-4 text-muted">
          <a href="#" className="transition hover:text-accent">
            Ajuda
          </a>
          <a href="#" className="transition hover:text-accent">
            Suporte
          </a>
        </div>
      </footer>
    </div>
  );
}
