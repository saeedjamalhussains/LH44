'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useCallback, useId, useMemo, useRef, useState } from 'react';

export interface Series {
  id: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
  fill?: boolean;
}

interface Bounds { minX: number; maxX: number; minY: number; maxY: number; }

function bounds(series: Series[], padY = 0.08, forceZero = false): Bounds {
  const xs = series.flatMap((s) => s.points.map((p) => p.x));
  const ys = series.flatMap((s) => s.points.map((p) => p.y));
  if (!xs.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (forceZero) minY = Math.min(0, minY);
  const span = maxY - minY || 1;
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs) || 1,
    minY: minY - span * padY, maxY: maxY + span * padY,
  };
}

const W = 1000;

/**
 * Technical line chart.
 *
 * Thin strokes, a sparse grid, small monospace ticks and no legend chrome —
 * the metric is the headline, the axes are annotation. Hover reports the index
 * so several charts can share one cursor.
 */
export function LineChart({
  series, height = 200, yTicks = 4, xTicks = 5, cursorIndex,
  onCursor, ariaLabel, forceZero = false, invertY = false, zeroLine = false, animate = true,
}: {
  series: Series[]; height?: number; yTicks?: number; xTicks?: number;
  cursorIndex?: number | null; onCursor?: (index: number | null) => void;
  ariaLabel: string; forceZero?: boolean; invertY?: boolean; zeroLine?: boolean;
  animate?: boolean;
}) {
  const id = useId();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const b = useMemo(() => bounds(series, 0.08, forceZero), [series, forceZero]);

  const H = height;
  const sx = (x: number) => ((x - b.minX) / (b.maxX - b.minX || 1)) * W;
  const sy = (y: number) => {
    const t = (y - b.minY) / (b.maxY - b.minY || 1);
    return invertY ? t * H : H - t * H;
  };

  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(' ');

  const handleMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!onCursor || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const primary = series[0];
    if (!primary?.points.length) return;
    onCursor(Math.max(0, Math.min(primary.points.length - 1, Math.round(ratio * (primary.points.length - 1)))));
  }, [onCursor, series]);

  const cursorX = cursorIndex != null && series[0]?.points[cursorIndex]
    ? sx(series[0].points[cursorIndex].x) : null;

  const yVals = Array.from({ length: yTicks + 1 }, (_, i) => b.minY + ((b.maxY - b.minY) * i) / yTicks);
  const xVals = Array.from({ length: xTicks + 1 }, (_, i) => b.minX + ((b.maxX - b.minX) * i) / xTicks);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className="h-full w-full touch-none"
      onMouseMove={handleMove}
      onMouseLeave={() => onCursor?.(null)}
    >
      <g stroke="#222222" strokeWidth="0.75">
        {yVals.map((v, i) => (
          <line key={`h${i}`} x1={0} x2={W} y1={sy(v)} y2={sy(v)} opacity={i === 0 ? 0.9 : 0.45} />
        ))}
        {xVals.map((v, i) => (
          <line key={`v${i}`} y1={0} y2={H} x1={sx(v)} x2={sx(v)} opacity={0.32} />
        ))}
      </g>

      {zeroLine && b.minY < 0 && b.maxY > 0 && (
        <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} stroke="#8A8A8A" strokeWidth="1" strokeDasharray="4 4" />
      )}

      {series.map((s) => (
        <g key={s.id}>
          {s.fill && (
            <path
              d={`${path(s.points)} L${sx(s.points[s.points.length - 1]?.x ?? 0)} ${H} L${sx(s.points[0]?.x ?? 0)} ${H} Z`}
              fill={s.color} opacity={0.08}
            />
          )}
          <motion.path
            d={path(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            initial={animate && !reduced ? { pathLength: 0 } : false}
            animate={inView || reduced || !animate ? { pathLength: 1 } : {}}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </g>
      ))}

      {cursorX != null && (
        <g>
          <line x1={cursorX} x2={cursorX} y1={0} y2={H} stroke="#F4F4F4" strokeWidth="0.75" opacity={0.6} />
          {series.map((s) => {
            const p = s.points[cursorIndex!];
            return p ? (
              <circle key={`${id}-${s.id}`} cx={sx(p.x)} cy={sy(p.y)} r="3.5"
                fill="#050505" stroke={s.color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            ) : null;
          })}
        </g>
      )}
    </svg>
  );
}

/** Axis labels live outside the stretched SVG so text never distorts. */
export function ChartFrame({
  title, unit, value, children, height = 200, yMax, yMin, formatY = String,
}: {
  title: string; unit?: string; value?: string; children: React.ReactNode;
  height?: number; yMax?: number; yMin?: number; formatY?: (n: number) => string;
}) {
  return (
    <figure className="panel p-4 md:p-5">
      <figcaption className="mb-3 flex items-baseline justify-between gap-4">
        <span className="label">{title}{unit ? ` · ${unit}` : ''}</span>
        {value && <span className="font-mono text-sm text-ink tabular">{value}</span>}
      </figcaption>
      <div className="flex gap-3">
        {yMax != null && (
          <div className="flex w-10 shrink-0 flex-col justify-between py-[2px] text-right font-mono text-[9px] text-muted tabular">
            <span>{formatY(yMax)}</span>
            <span>{formatY(yMin ?? 0)}</span>
          </div>
        )}
        <div style={{ height }} className="min-w-0 flex-1">{children}</div>
      </div>
    </figure>
  );
}

/** Vertical bars. Used for season-by-season comparisons. */
export function BarChart({
  data, height = 220, color = '#C9A227', compareColor = '#3A3F44',
  ariaLabel, formatValue = String, onSelect, selected,
}: {
  data: { label: string; value: number; compare?: number; highlight?: boolean }[];
  height?: number; color?: string; compareColor?: string; ariaLabel: string;
  formatValue?: (n: number) => string;
  onSelect?: (label: string) => void; selected?: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.compare ?? 0)), 1);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div role="img" aria-label={ariaLabel} className="flex w-full items-end gap-[2px]" style={{ height }}>
      {data.map((d, i) => {
        const active = selected === d.label || hover === i;
        return (
          <button
            key={d.label}
            type="button"
            tabIndex={onSelect ? 0 : -1}
            aria-label={`${d.label}: ${formatValue(d.value)}`}
            onClick={() => onSelect?.(d.label)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            {d.compare != null && (
              <motion.div
                initial={{ height: 0 }} whileInView={{ height: `${(d.compare / max) * 100}%` }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.015 }}
                className="absolute bottom-0 w-full" style={{ background: compareColor, opacity: 0.55 }}
              />
            )}
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${(d.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full"
              style={{
                background: d.highlight ? color : active ? '#F4F4F4' : color,
                opacity: d.highlight ? 1 : active ? 1 : 0.72,
              }}
            />
            {active && (
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2
                whitespace-nowrap border border-line bg-noir px-2 py-1 font-mono text-[10px] text-ink tabular">
                {d.label} · {formatValue(d.value)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Horizontal head-to-head split bar. */
export function SplitBar({
  left, right, leftLabel, rightLabel, leftColor = '#F4F4F4', rightColor = '#8A8A8A',
}: {
  left: number; right: number; leftLabel: string; rightLabel: string;
  leftColor?: string; rightColor?: string;
}) {
  const total = left + right || 1;
  const pct = (left / total) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between font-mono text-xs tabular">
        <span style={{ color: leftColor }}>{left}</span>
        <span style={{ color: rightColor }}>{right}</span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden bg-line" role="img"
        aria-label={`${leftLabel} ${left}, ${rightLabel} ${right}`}>
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ background: leftColor }} />
        <div className="flex-1" style={{ background: rightColor, opacity: 0.5 }} />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

/** Tyre stint bar. */
export function StintBar({
  stints, totalLaps, colors,
}: {
  stints: { compound: string; from: number; to: number }[];
  totalLaps: number; colors: Record<string, string>;
}) {
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden border border-line" role="img"
        aria-label={stints.map((s) => `${s.compound} laps ${s.from} to ${s.to}`).join(', ')}>
        {stints.map((s, i) => (
          <motion.div
            key={`${s.compound}-${i}`}
            initial={{ width: 0 }}
            whileInView={{ width: `${((s.to - s.from + 1) / totalLaps) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="flex items-center justify-center overflow-hidden"
            style={{ background: colors[s.compound] ?? colors.Unknown, opacity: 0.85 }}
          >
            {/* Narrow stints have no room for a label; the colour carries it. */}
            {(s.to - s.from + 1) / totalLaps > 0.12 && (
              <span className="font-mono text-[9px] uppercase tracking-wider"
                style={{ color: s.compound === 'Hard' ? '#050505' : '#F4F4F4' }}>
                {s.compound.slice(0, 3)}
              </span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] text-muted tabular">
        <span>LAP 1</span><span>LAP {totalLaps}</span>
      </div>
    </div>
  );
}
