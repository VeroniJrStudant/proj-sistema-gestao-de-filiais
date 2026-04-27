import { ModuleGate } from "@/components/module-gate";
import { prisma } from "@/lib/prisma";

export default async function CamerasPage() {
  const cameras = await prisma.securityCamera.findMany({ orderBy: { name: "asc" } });

  return (
    <ModuleGate id="cameras">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-semibold text-ink">Câmeras de segurança</h1>
        <p className="mt-1 text-sm text-muted">
          Pontos monitorados e estado da conexão (integração com DVR/NVR ou link seguro).
        </p>
        <ul className="mt-6 space-y-3">
          {cameras.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-line bg-elevated-2 px-4 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink">{c.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    c.status === "ONLINE"
                      ? "border-success-border bg-success-bg text-success-fg"
                      : c.status === "MAINTENANCE"
                        ? "border-caution-border bg-caution-soft text-caution"
                        : "border-line bg-elevated text-muted"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {c.location ?? "Sem local"} {c.vendor ? `· ${c.vendor}` : ""}
              </p>
              {c.streamUrl && (
                <a
                  href={c.streamUrl}
                  className="mt-2 inline-block text-sm font-medium text-accent-muted underline decoration-accent-border underline-offset-2 hover:text-accent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir stream
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ModuleGate>
  );
}
