'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import type { TelemetryPoint } from '@/lib/types';

/**
 * Circuit trace drawn from telemetry X/Y position channels.
 *
 * The line draws itself on mount, and the 44 marker sits at the cursor
 * position so it stays synchronised with every chart on the page.
 */
export default function CircuitMap({
  trace, cursorIndex, accent = '#F4F4F4', label, colorBy,
}: {
  trace: TelemetryPoint[];
  cursorIndex: number | null;
  accent?: string;
  label: string;
  colorBy?: 'speed' | null;
}) {
  const reduced = useReducedMotion();

  const { path, points, bounds } = useMemo(() => {
    const pts = trace.filter((p) => p.X != null && p.Y != null);
    if (!pts.length) return { path: '', points: [], bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } };
    const xs = pts.map((p) => p.X!), ys = pts.map((p) => p.Y!);
    const b = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    const w = b.maxX - b.minX || 1, h = b.maxY - b.minY || 1;
    const nx = (x: number) => ((x - b.minX) / w) * 900 + 50;
    const ny = (y: number) => 500 - ((y - b.minY) / h) * 400 - 50;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${nx(p.X!).toFixed(1)} ${ny(p.Y!).toFixed(1)}`).join(' ') + ' Z';
    return {
      path: d,
      points: pts.map((p) => ({ x: nx(p.X!), y: ny(p.Y!), speed: p.Speed ?? 0 })),
      bounds: b,
    };
  }, [trace]);

  if (!path) {
    return (
      <div className="flex h-full items-center justify-center border border-line p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          Position channels unavailable for this lap
        </p>
      </div>
    );
  }

  const marker = cursorIndex != null ? points[Math.min(cursorIndex, points.length - 1)] : null;
  const maxSpeed = Math.max(...points.map((p) => p.speed), 1);

  return (
    <svg viewBox="0 0 1000 500" className="h-full w-full" role="img" aria-label={label}>
      {colorBy === 'speed' ? (
        <g>
          {points.slice(0, -1).map((p, i) => {
            const t = p.speed / maxSpeed;
            return (
              <line key={i} x1={p.x} y1={p.y} x2={points[i + 1].x} y2={points[i + 1].y}
                stroke={`hsl(${20 + t * 180}, 70%, ${35 + t * 25}%)`} strokeWidth="5" strokeLinecap="round" />
            );
          })}
        </g>
      ) : (
        <>
          <path d={path} fill="none" stroke="#222222" strokeWidth="9" strokeLinejoin="round" />
          <motion.path
            d={path} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </>
      )}

      {marker && (
        <g transform={`translate(${marker.x} ${marker.y})`}>
          <circle r="17" fill="#050505" stroke={accent} strokeWidth="1.5" />
          <text textAnchor="middle" dominantBaseline="central" y="1"
            className="font-display" fontSize="16" fill={accent}>44</text>
        </g>
      )}
    </svg>
  );
}
