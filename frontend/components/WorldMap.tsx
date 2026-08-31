'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BarChart } from './charts';
import CircuitSilhouette from './CircuitSilhouette';
import ImageCredit from './ImageCredit';
import { SourceBadge } from './ui';
import { trackFor } from '@/lib/images';
import world from '@/data/world-map.json';
import { shapeFor } from '@/lib/shapes';
import type { Circuit } from '@/lib/types';

/**
 * Interactive circuit map.
 *
 * An equirectangular projection over a simplified vector landmass, rather than
 * a bitmap: it stays sharp, themes correctly and ships no external tiles. Each
 * marker is a real button, so the map is fully keyboard operable.
 */
const WORLD = world as {
  viewBox: string; width: number; height: number; fillRule?: string;
  paths: string[]; source: string; sourceUrl: string; licence: string;
};

interface View { x: number; y: number; w: number; h: number }

/**
 * The default view is cropped to the band that actually contains land, rather
 * than the full -90..90 of the projection. Antarctica is excluded from the
 * geometry, so showing the whole sphere would leave a dead strip of ocean along
 * the bottom and shrink every continent for nothing.
 */
const lat2y = (lat: number) => ((90 - lat) / 180) * WORLD.height;
const MAP_TOP = lat2y(84);
const MAP_BOTTOM = lat2y(-58);

const WORLD_VIEW: View = {
  x: 0, y: MAP_TOP, w: WORLD.width, h: MAP_BOTTOM - MAP_TOP,
};
const ASPECT = WORLD_VIEW.w / WORLD_VIEW.h;

/**
 * Regions worth jumping to.
 *
 * Europe holds more than half of Hamilton's circuits inside a few degrees, so
 * at world scale those markers overlap. Each preset is a lon/lat box, converted
 * to the map's own coordinates below.
 */
const REGIONS: { id: string; label: string; lon: [number, number]; lat: [number, number] }[] = [
  { id: 'world', label: 'World', lon: [-180, 180], lat: [-60, 84] },
  { id: 'europe', label: 'Europe', lon: [-12, 32], lat: [34, 60] },
  { id: 'americas', label: 'Americas', lon: [-125, -35], lat: [-35, 52] },
  { id: 'asia', label: 'Asia-Pacific', lon: [95, 155], lat: [-40, 46] },
  { id: 'middle-east', label: 'Middle East', lon: [25, 60], lat: [12, 45] },
];

const MIN_W = WORLD.width / 14;   // deepest zoom
const MAX_W = WORLD.width;        // whole world

/** Clamp a view so it stays inside the map and keeps the map's aspect ratio. */
function clampView(v: View): View {
  const w = Math.min(MAX_W, Math.max(MIN_W, v.w));
  const h = w / ASPECT;
  return {
    w, h,
    x: Math.min(Math.max(0, v.x), WORLD.width - w),
    // Panning stays inside the inhabited band rather than the whole projection.
    y: Math.min(Math.max(MAP_TOP, v.y), Math.max(MAP_TOP, MAP_BOTTOM - h)),
  };
}

function regionView(r: (typeof REGIONS)[number]): View {
  const x1 = ((r.lon[0] + 180) / 360) * WORLD.width;
  const x2 = ((r.lon[1] + 180) / 360) * WORLD.width;
  const y1 = ((90 - r.lat[1]) / 180) * WORLD.height;
  const y2 = ((90 - r.lat[0]) / 180) * WORLD.height;
  // Widen to the map's aspect ratio around the box centre.
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const w = Math.max(x2 - x1, (y2 - y1) * ASPECT) * 1.12;
  return clampView({ x: cx - w / 2, y: cy - w / ASPECT / 2, w, h: w / ASPECT });
}

/** Equirectangular, matching the projection the landmass was built with. */
function project(lat: number, lng: number) {
  return {
    x: ((lng + 180) / 360) * WORLD.width,
    y: ((90 - lat) / 180) * WORLD.height,
  };
}

export default function WorldMap({ circuits, source }: { circuits: Circuit[]; source: string }) {
  // Only circuits with coordinates can be plotted; the rest still appear in the
  // table below the map.
  const plotted = useMemo(
    () => circuits.filter((c) => c.lat != null && c.lng != null), [circuits]);
  const [selected, setSelected] = useState<Circuit>(
    () => [...plotted].sort((a, b) => b.wins - a.wins)[0]);
  const maxWins = useMemo(() => Math.max(...circuits.map((c) => c.wins), 1), [circuits]);
  const track = trackFor(selected.id);
  const outline = shapeFor(selected.id);

  const [view, setView] = useState<View>(WORLD_VIEW);
  const [region, setRegion] = useState('world');
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);

  const zoomLevel = WORLD.width / view.w;
  // Markers and strokes are drawn in map units, so they must shrink as we zoom
  // in or they swamp the countries underneath.
  const k = 1 / zoomLevel;

  const applyRegion = useCallback((id: string) => {
    const r = REGIONS.find((x) => x.id === id);
    if (!r) return;
    setRegion(id);
    setView(id === 'world' ? WORLD_VIEW : regionView(r));
  }, []);

  const zoomBy = useCallback((factor: number, originX?: number, originY?: number) => {
    setRegion('');
    setView((v) => {
      const w = Math.min(MAX_W, Math.max(MIN_W, v.w / factor));
      const h = w / ASPECT;
      // Keep the point under the cursor fixed while scaling.
      const ox = originX ?? v.x + v.w / 2;
      const oy = originY ?? v.y + v.h / 2;
      const rx = (ox - v.x) / v.w;
      const ry = (oy - v.y) / v.h;
      return clampView({ x: ox - rx * w, y: oy - ry * h, w, h });
    });
  }, []);

  /** Convert a pointer event to map coordinates. */
  const toMap = useCallback((clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: view.x + ((clientX - r.left) / r.width) * view.w,
      y: view.y + ((clientY - r.top) / r.height) * view.h,
    };
  }, [view]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <figure className="panel min-w-0 max-w-full overflow-hidden p-4 md:p-6">
        <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <span className="label">Circuits raced · marker size by wins</span>
          <span className="font-mono text-[10px] text-muted">{plotted.length} circuits mapped</span>
        </figcaption>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-px" role="group" aria-label="Zoom to region">
            {REGIONS.map((r) => (
              <button
                key={r.id} type="button" onClick={() => applyRegion(r.id)}
                aria-pressed={region === r.id}
                className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]
                  transition-colors ${region === r.id
                    ? 'border-ink bg-ink text-noir' : 'border-line text-muted hover:text-ink'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted tabular">
              {zoomLevel.toFixed(1)}×
            </span>
            <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out"
              className="border border-line px-3 py-1.5 font-mono text-[11px] text-muted hover:text-ink">−</button>
            <button type="button" onClick={() => zoomBy(1.6)} aria-label="Zoom in"
              className="border border-line px-3 py-1.5 font-mono text-[11px] text-muted hover:text-ink">+</button>
            <button type="button" onClick={() => applyRegion('world')} aria-label="Reset the map"
              className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink">
              Reset
            </button>
          </div>
        </div>
        <div className="scroll-x max-w-full">
          <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className={`w-[720px] max-w-none md:w-full md:min-w-[720px] ${
              drag.current ? 'cursor-grabbing' : 'cursor-grab'}`}
            // At world view the page must still scroll on touch; once zoomed in,
            // the gesture belongs to the map.
            style={{ touchAction: zoomLevel > 1.05 ? 'none' : 'pan-y' }}
            role="group"
            aria-label="World map of circuits Lewis Hamilton has raced at. Scroll to zoom, drag to pan."
            onWheel={(e) => {
              const p = toMap(e.clientX, e.clientY);
              zoomBy(e.deltaY < 0 ? 1.18 : 1 / 1.18, p?.x, p?.y);
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !svgRef.current) return;
              const r = svgRef.current.getBoundingClientRect();
              setView((v) => clampView({
                ...v,
                x: d.vx - ((e.clientX - d.px) / r.width) * v.w,
                y: d.vy - ((e.clientY - d.py) / r.height) * v.h,
              }));
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerLeave={() => { drag.current = null; }}
          >
            {/* Rings that straddle the antimeridian are drawn continuous and
                then repeated on the far side, so both copies overhang the map.
                This clip trims them to the world rectangle. */}
            <defs>
              <clipPath id="world-clip">
                <rect x={0} y={0} width={WORLD.width} height={WORLD.height} />
              </clipPath>
            </defs>
            <rect width={WORLD.width} height={WORLD.height} fill="#0A0A0A" />
            {/* Graticule every 30° of longitude and latitude. */}
            <g stroke="#171717" strokeWidth={0.5 * k}>
              {Array.from({ length: 13 }).map((_, i) => (
                <line key={`v${i}`} x1={(i * WORLD.width) / 12} x2={(i * WORLD.width) / 12}
                  y1={0} y2={WORLD.height} />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`h${i}`} x1={0} x2={WORLD.width}
                  y1={(i * WORLD.height) / 6} y2={(i * WORLD.height) / 6} />
              ))}
            </g>
            <g clipPath="url(#world-clip)" fill="#161616" stroke="#2A2A2A" strokeWidth={0.4 * k}
              fillRule={(WORLD.fillRule as 'evenodd') ?? 'nonzero'}>
              {WORLD.paths.map((d, i) => <path key={i} d={d} />)}
            </g>

            {plotted.map((c) => {
              const { x, y } = project(c.lat!, c.lng!);
              const active = selected.id === c.id;
              const r = (3.2 + (c.wins / maxWins) * 7) * k;
              return (
                <g key={c.id}>
                  <circle
                    cx={x} cy={y} r={r}
                    fill={c.wins > 0 ? '#C9A227' : '#3A3F44'}
                    opacity={active ? 1 : 0.72}
                  />
                  {active && (
                    <circle cx={x} cy={y} r={r + 6 * k} fill="none" stroke="#F4F4F4" strokeWidth={1.2 * k} />
                  )}
                  <circle
                    cx={x} cy={y} r={Math.max(r, 9 * k)} fill="transparent"
                    tabIndex={0} role="button"
                    aria-label={`${c.name}, ${c.country}. ${c.wins} wins from ${c.starts} starts.`}
                    onClick={() => setSelected(c)}
                    onFocus={() => setSelected(c)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(c); }}
                    className="cursor-pointer focus:outline-none"
                  />
                </g>
              );
            })}

            {(() => {
              const { x, y } = project(selected.lat!, selected.lng!);
              return (
                <text x={x + 14 * k} y={y + 4 * k} className="font-display"
                  fontSize={14 * k} fill="#F4F4F4">44</text>
              );
            })()}
          </svg>
        </div>
        <SourceBadge className="mt-4" source={source} />
      </figure>

      <motion.aside key={selected.id} initial={{ y: 10 }} animate={{ y: 0 }}
        transition={{ duration: 0.35 }} className="panel min-w-0 p-6">
        {track ? (
          <div>
            <div className="relative aspect-[16/10] overflow-hidden border border-line">
              <Image src={track.src} alt={track.alt} fill priority
                sizes="(min-width: 1024px) 28vw, 100vw" className="object-cover" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir/70 to-transparent" />
              <span aria-hidden className="absolute bottom-2 right-3 font-display text-3xl text-ink/40">44</span>
            </div>
            <ImageCredit image={track} />
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center border border-line bg-noir">
            <p className="px-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted">
              No freely licensed photograph of this circuit
            </p>
          </div>
        )}

        {outline && (
          <figure className="mt-5 border border-line bg-noir p-3">
            <figcaption className="label mb-1">Circuit layout</figcaption>
            <div className="h-40">
              <CircuitSilhouette shape={outline} accent="#C9A227" showMarker={false} />
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
              <span className="mr-1.5 border border-line px-1 py-px text-[8px] text-silver">TRACE</span>
              <a href={outline.source} target="_blank" rel="noreferrer noopener" className="hover:text-gold">
                {outline.artist}
              </a>
              <span className="mx-1 text-silver-dim">·</span>
              {outline.licenceUrl ? (
                <a href={outline.licenceUrl} target="_blank" rel="noreferrer noopener" className="hover:text-gold">
                  {outline.licence}
                </a>
              ) : outline.licence}
              <span className="mx-1 text-silver-dim">·</span>Wikimedia Commons
            </p>
          </figure>
        )}

        <p className="label mt-6">{selected.country} · {selected.firstYear}–{selected.lastYear}</p>
        <h3 className="display mt-2 text-3xl md:text-4xl">{selected.name}</h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {selected.gp}
          {selected.length != null && ` · ${selected.length} km`}
          {selected.turns != null && ` · ${selected.turns} turns`}
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-5 border-y border-line py-6">
          {([
            ['Starts', selected.starts],
            ['Wins', selected.wins],
            ['Podiums', selected.podiums],
            ['P1 starts', selected.p1Starts],
            ['Best', selected.bestFinish != null ? `P${selected.bestFinish}` : '—'],
            ['Points', selected.points],
          ] as [string, string | number][]).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="label">{k}</dt>
              <dd className={`display mt-2 text-3xl ${k === 'Wins' ? 'text-gold' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>

        <dl className="mt-5 grid grid-cols-3 gap-5 font-mono text-xs">
          {([
            ['Avg grid', selected.avgGrid ?? '—'],
            ['Avg finish', selected.avgFinish ?? '—'],
            ['Retirements', selected.dnfs],
          ] as [string, string | number][]).map(([k, v]) => (
            <div key={k}>
              <dt className="label">{k}</dt>
              <dd className="mt-1 text-tech tabular">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="label mt-7 mb-3">Hamilton at this circuit</p>
        <BarChart
          height={100}
          data={[
            { label: 'Starts', value: selected.starts },
            { label: 'Wins', value: selected.wins, highlight: true },
            { label: 'Podiums', value: selected.podiums },
            { label: 'P1 starts', value: selected.p1Starts },
          ]}
          ariaLabel={`Hamilton's record at ${selected.name}`}
        />
        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase text-muted">
          <span>Starts</span><span>Wins</span><span>Podiums</span><span>P1</span>
        </div>
        <SourceBadge className="mt-5" source={selected.source} />
      </motion.aside>
    </div>
  );
}
