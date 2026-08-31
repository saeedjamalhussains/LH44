'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CircuitShape } from '@/lib/shapes';

/**
 * A real circuit outline, traced from a freely licensed vector on Wikimedia
 * Commons rather than drawn by hand.
 *
 * The 44 marker is placed with getPointAtLength() on the actual track path, so
 * lap playback follows the true geometry of the circuit. `progress` is the
 * fraction of the lap completed (0–1); pass null to hide the marker.
 */
export default function CircuitSilhouette({
  shape, progress = null, accent = '#F4F4F4', showMarker = true, className = '', draw = true,
}: {
  shape: CircuitShape;
  progress?: number | null;
  accent?: string;
  showMarker?: boolean;
  className?: string;
  draw?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const path = pathRef.current;
    if (!path || progress == null) { setPoint(null); return; }
    try {
      const total = path.getTotalLength();
      if (!total) return;
      const p = path.getPointAtLength(Math.max(0, Math.min(1, progress)) * total);
      setPoint({ x: p.x, y: p.y });
    } catch {
      setPoint(null);
    }
  }, [progress, shape.d]);

  // The traced paths are normalised into a 100×100 box, so one scale works.
  const u = shape.width / 100;

  return (
    <svg
      viewBox={shape.viewBox}
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`${shape.name} circuit layout${
        progress != null ? `, car at ${Math.round(progress * 100)}% of the lap` : ''}`}
    >
      <path d={shape.d} fill="none" stroke="#222222"
        strokeWidth={2.6 * u} strokeLinejoin="round" strokeLinecap="round" />
      <motion.path
        ref={pathRef}
        d={shape.d}
        fill="none"
        stroke={accent}
        strokeWidth={0.9 * u}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={draw && !reduced ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
      />

      {showMarker && point && (
        <g transform={`translate(${point.x} ${point.y})`}>
          <circle r={4.2 * u} fill="#050505" stroke={accent} strokeWidth={0.5 * u} />
          <text textAnchor="middle" dominantBaseline="central" y={0.2 * u}
            className="font-display" fontSize={4 * u} fill={accent}>44</text>
        </g>
      )}
    </svg>
  );
}
