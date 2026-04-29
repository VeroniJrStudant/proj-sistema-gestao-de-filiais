"use client";

import { useMemo, useRef, useState } from "react";
import type { BiChartsPayload } from "@/lib/dashboard-stats";
import { formatBRL } from "@/lib/format-brl";

type VizId = "bars" | "area" | "kind" | "status" | "donut";

const VIZ: { id: VizId; label: string }[] = [
  { id: "bars", label: "Colunas + linha" },
  { id: "area", label: "Área" },
  { id: "kind", label: "Por tipo" },
  { id: "status", label: "Por status" },
  { id: "donut", label: "Entrada × saída" },
];

type Props = {
  charts: BiChartsPayload;
  periodInCents: number;
  periodOutCents: number;
};

const VB_W = 100;
const VB_H = 52;
const PAD_L = 8;
const PAD_R = 4;
const PAD_T = 6;
const PAD_B = 12;

function polar(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function BiAnalyticsCharts({ charts, periodInCents, periodOutCents }: Props) {
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [viz, setViz] = useState<VizId>("bars");
  const [tip, setTip] = useState<{ x: number; y: number; title: string; lines: string[] } | null>(null);

  function setTipFromMouse(e: React.MouseEvent, title: string, lines: string[]) {
    const wrap = chartWrapRef.current;
    if (!wrap) return;
    const b = wrap.getBoundingClientRect();
    setTip({ x: e.clientX - b.left, y: e.clientY - b.top, title, lines });
  }

  const timeline = charts.timeline;
  const hasRows = charts.recordCount > 0;
  const innerW = VB_W - PAD_L - PAD_R;
  const innerH = VB_H - PAD_T - PAD_B;

  const timelineScale = useMemo(() => {
    let max = 1;
    for (const p of timeline) {
      max = Math.max(max, p.inCents, p.outCents, Math.abs(p.netCents));
    }
    return { max };
  }, [timeline]);

  const n = Math.max(timeline.length, 1);
  const slot = innerW / n;
  const barW = Math.min(slot * 0.32, 3.2);

  const netPath = useMemo(() => {
    const { max } = timelineScale;
    const pts: string[] = [];
    timeline.forEach((p, i) => {
      const x = PAD_L + (i + 0.5) * slot;
      const y = PAD_T + innerH - (p.netCents / max) * innerH * 0.5 - innerH * 0.5;
      pts.push(`${x},${y}`);
    });
    return pts.join(" ");
  }, [timeline, timelineScale, slot, innerH]);

  const areaInPathD = useMemo(() => {
    if (timeline.length === 0) return "";
    const { max } = timelineScale;
    const baseY = PAD_T + innerH;
    let d = "";
    timeline.forEach((p, i) => {
      const x = PAD_L + (i + 0.5) * slot;
      const y = PAD_T + innerH - (p.inCents / max) * innerH * 0.92;
      d += i === 0 ? `M ${x} ${baseY} L ${x} ${y}` : ` L ${x} ${y}`;
    });
    const lastX = PAD_L + (timeline.length - 0.5) * slot;
    d += ` L ${lastX} ${baseY} Z`;
    return d;
  }, [timeline, timelineScale, slot, innerH]);

  const areaOutPathD = useMemo(() => {
    if (timeline.length === 0) return "";
    const { max } = timelineScale;
    const baseY = PAD_T + innerH;
    let d = "";
    timeline.forEach((p, i) => {
      const x = PAD_L + (i + 0.5) * slot;
      const y = PAD_T + innerH - (p.outCents / max) * innerH * 0.92;
      d += i === 0 ? `M ${x} ${baseY} L ${x} ${y}` : ` L ${x} ${y}`;
    });
    const lastX = PAD_L + (timeline.length - 0.5) * slot;
    d += ` L ${lastX} ${baseY} Z`;
    return d;
  }, [timeline, timelineScale, slot, innerH]);

  const kindMax = useMemo(() => {
    let m = 1;
    for (const k of charts.byKind) m = Math.max(m, k.inCents + k.outCents);
    return m;
  }, [charts.byKind]);

  const statusMax = useMemo(() => {
    let m = 1;
    for (const s of charts.byStatus) m = Math.max(m, s.sumCents);
    return m;
  }, [charts.byStatus]);

  const donutTotal = periodInCents + periodOutCents;

  return (
    <div className="mt-4 rounded-xl border border-line-soft bg-shell/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-muted">Gráficos analíticos</p>
          <p className="text-xs text-muted">Visualização no estilo painel BI (período e vínculo dos filtros acima)</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {VIZ.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setViz(v.id)}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                viz === v.id
                  ? "bg-accent text-on-accent shadow-sm"
                  : "border border-line-soft bg-elevated-2 text-muted hover:text-ink"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {charts.truncated ? (
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
          Amostra limitada a {charts.recordCount.toLocaleString("pt-BR")} lançamentos para desempenho. Totais nos
          cartões acima refletem o período completo.
        </p>
      ) : null}

      {!hasRows ? (
        <p className="mt-3 text-center text-sm text-muted">Nenhum lançamento no período para plotar.</p>
      ) : (
        <div ref={chartWrapRef} className="relative mt-3 w-full overflow-x-auto">
          {tip ? (
            <div
              className="pointer-events-none absolute z-10 max-w-[220px] rounded-lg border border-line bg-elevated-2 px-2 py-1.5 text-[11px] text-ink shadow-lg"
              style={{ left: tip.x, top: tip.y, transform: "translate(-50%, -100%)" }}
            >
              <p className="font-semibold">{tip.title}</p>
              {tip.lines.map((line, idx) => (
                <p key={idx} className="text-muted">
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          {viz === "bars" || viz === "area" ? (
            <svg
              className="h-56 w-full min-w-[280px] text-ink"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setTip(null)}
            >
              <defs>
                <linearGradient id="biAreaInGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id="biAreaOutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.06" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = PAD_T + innerH * (1 - t);
                return (
                  <line
                    key={t}
                    x1={PAD_L}
                    y1={y}
                    x2={VB_W - PAD_R}
                    y2={y}
                    className="stroke-line-soft"
                    strokeWidth={0.15}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {viz === "bars"
                ? timeline.map((p, i) => {
                    const { max } = timelineScale;
                    const cx = PAD_L + (i + 0.5) * slot;
                    const hIn = (p.inCents / max) * innerH * 0.85;
                    const hOut = (p.outCents / max) * innerH * 0.85;
                    const zeroY = PAD_T + innerH;
                    return (
                      <g key={p.key}>
                        <rect
                          x={cx - barW - 0.15}
                          y={zeroY - hIn}
                          width={barW}
                          height={hIn}
                          className="fill-emerald-500/85"
                          onMouseMove={(e) =>
                            setTipFromMouse(e, p.label, [
                              `Entrada: ${formatBRL(p.inCents)}`,
                              `Saída: ${formatBRL(p.outCents)}`,
                              `Líquido: ${formatBRL(p.netCents)}`,
                            ])
                          }
                        />
                        <rect
                          x={cx + 0.15}
                          y={zeroY - hOut}
                          width={barW}
                          height={hOut}
                          className="fill-rose-500/80"
                          onMouseMove={(e) =>
                            setTipFromMouse(e, p.label, [
                              `Entrada: ${formatBRL(p.inCents)}`,
                              `Saída: ${formatBRL(p.outCents)}`,
                              `Líquido: ${formatBRL(p.netCents)}`,
                            ])
                          }
                        />
                      </g>
                    );
                  })
                : null}
              {viz === "area" ? (
                <>
                  <path d={areaOutPathD} fill="url(#biAreaOutGrad)" className="stroke-rose-600/60" strokeWidth={0.15} />
                  <path d={areaInPathD} fill="url(#biAreaInGrad)" className="stroke-emerald-700/70" strokeWidth={0.2} />
                </>
              ) : null}
              {viz === "bars" ? (
                <polyline
                  fill="none"
                  className="stroke-sky-600"
                  strokeWidth={0.35}
                  points={netPath}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {timeline.map((p, i) => {
                if (n > 18 && i % Math.ceil(n / 12) !== 0) return null;
                const x = PAD_L + (i + 0.5) * slot;
                return (
                  <text
                    key={`lbl-${p.key}`}
                    x={x}
                    y={VB_H - 2}
                    textAnchor="middle"
                    className="fill-muted text-[2.2px]"
                    style={{ fontSize: "2.2px" }}
                  >
                    {p.label.length > 8 ? `${p.label.slice(0, 6)}…` : p.label}
                  </text>
                );
              })}
            </svg>
          ) : null}

          {viz === "kind" ? (
            <svg className="h-48 w-full min-w-[260px]" viewBox="0 0 100 44" preserveAspectRatio="xMidYMid meet">
              {charts.byKind.length === 0 ? (
                <text x={50} y={22} textAnchor="middle" className="fill-muted text-[3px]">
                  Sem dados por tipo
                </text>
              ) : (
                charts.byKind.map((k, i) => {
                  const rowH = 3.6;
                  const y0 = 4 + i * (rowH + 0.8);
                  const wIn = (k.inCents / kindMax) * 52;
                  const wOut = (k.outCents / kindMax) * 52;
                  return (
                    <g key={k.kind}>
                      <text x={0} y={y0 + 2.4} className="fill-ink text-[2.6px]" style={{ fontSize: "2.6px" }}>
                        {k.label.length > 14 ? `${k.label.slice(0, 12)}…` : k.label}
                      </text>
                      <rect x={34} y={y0} width={wIn} height={rowH} rx={0.4} className="fill-emerald-500/85" />
                      <rect x={34 + wIn + 0.3} y={y0} width={wOut} height={rowH} rx={0.4} className="fill-rose-500/78" />
                      <text x={92} y={y0 + 2.5} textAnchor="end" className="fill-muted text-[2.2px]">
                        {formatBRL(k.inCents + k.outCents)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          ) : null}

          {viz === "status" ? (
            <svg className="h-44 w-full min-w-[240px]" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet">
              {charts.byStatus.length === 0 ? (
                <text x={50} y={20} textAnchor="middle" className="fill-muted text-[3px]">
                  Sem dados por status
                </text>
              ) : (
                charts.byStatus.map((s, i) => {
                  const rowH = 4.5;
                  const y0 = 4 + i * (rowH + 0.6);
                  const w = (s.sumCents / statusMax) * 70;
                  return (
                    <g key={s.status}>
                      <text x={0} y={y0 + 3} className="fill-ink text-[2.8px]">
                        {s.label}
                      </text>
                      <rect x={28} y={y0} width={Math.max(w, 0.4)} height={rowH} rx={0.5} className="fill-accent/80" />
                      <text x={99} y={y0 + 3} textAnchor="end" className="fill-muted text-[2.4px]">
                        {s.count} · {formatBRL(s.sumCents)}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          ) : null}

          {viz === "donut" ? (
            <div className="flex flex-col items-center gap-2 py-2 sm:flex-row sm:justify-center sm:gap-8">
              <svg className="h-44 w-44 shrink-0" viewBox="0 0 36 36">
                {donutTotal <= 0 ? (
                  <text x={18} y={18} textAnchor="middle" className="fill-muted text-[2.5px]">
                    Sem valores
                  </text>
                ) : (
                  (() => {
                    const inFrac = periodInCents / donutTotal;
                    const a0 = -Math.PI / 2;
                    const a1 = a0 + inFrac * 2 * Math.PI;
                    const a2 = a0 + 2 * Math.PI;
                    return (
                      <>
                        <path d={polar(18, 18, 14, a0, a1)} className="fill-emerald-500/90" />
                        <path d={polar(18, 18, 14, a1, a2)} className="fill-rose-500/85" />
                        <circle cx={18} cy={18} r={7.5} className="fill-shell stroke-line-soft" strokeWidth={0.3} />
                        <text x={18} y={17.2} textAnchor="middle" className="fill-ink text-[2.8px] font-semibold">
                          {formatBRL(donutTotal)}
                        </text>
                        <text x={18} y={20.5} textAnchor="middle" className="fill-muted text-[2px]">
                          no período
                        </text>
                      </>
                    );
                  })()
                )}
              </svg>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-muted">Entradas</span>
                  <strong className="text-ink">{formatBRL(periodInCents)}</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                  <span className="text-muted">Saídas</span>
                  <strong className="text-ink">{formatBRL(periodOutCents)}</strong>
                </li>
              </ul>
            </div>
          ) : null}

          <p className="mt-1 text-center text-[10px] text-subtle">
            {charts.recordCount.toLocaleString("pt-BR")} lançamento(s) no gráfico
          </p>
        </div>
      )}
    </div>
  );
}
