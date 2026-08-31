'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StintBar } from './charts';
import { ErrorState, LoadingState, SourceBadge } from './ui';
import { TYRE_COLORS } from '@/lib/format';
import type { FeaturedRace } from '@/lib/types';

interface RaceData {
  race?: { gp: string; date?: string; team?: string | null; grid?: number | null;
           finish?: number | null; points?: number; laps?: number | null;
           status?: string; fastestLapTime?: string | null };
  weather?: { available: boolean; airTemp?: number; trackTemp?: number; rainfall?: boolean; humidity?: number };
  tyres?: { available: boolean; stints?: { compound: string; from: number; to: number; laps: number }[] };
  positions?: { available: boolean; positions?: { lap: number; position: number }[] };
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="display mt-2 text-3xl md:text-4xl">{value ?? '—'}</p>
    </div>
  );
}

/**
 * Race detail: the story and the data, kept in separate sections.
 *
 * Everything below RACE STORY is loaded from the data service. The story text,
 * where one exists, comes from the editorial snapshot.
 */
export default function RaceDetail({
  year, gp, circuitName, seed,
}: { year: number; gp: string; circuitName?: string; seed: FeaturedRace | null }) {
  const [data, setData] = useState<RaceData | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/f1/race/${year}/${encodeURIComponent(gp)}`);
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!cancelled) { setData(json); setState('ok'); }
      } catch {
        if (!cancelled) setState('unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, [year, gp]);

  const r = data?.race;
  const grid = r?.grid ?? seed?.grid ?? null;
  const finish = r?.finish ?? seed?.finish ?? null;
  const points = r?.points ?? seed?.points ?? null;
  const laps = r?.laps ?? seed?.laps ?? null;
  const positions = data?.positions?.available ? data.positions.positions ?? [] : [];

  return (
    <div className="space-y-10">
      {/* RACE STORY */}
      <section aria-labelledby="story" className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 id="story" className="display text-4xl md:text-6xl">Race story</h2>
          {seed ? (
            <p className="mt-6 max-w-2xl text-lg leading-[1.75] text-tech">{seed.story}</p>
          ) : (
            <p className="mt-6 max-w-2xl leading-relaxed text-muted">
              No editorial entry exists for this race in the local snapshot. The result and session
              data below are read from the archive.
            </p>
          )}
          {seed && <SourceBadge className="mt-6" source="Editorial — this site" />}
        </div>

        <dl className="panel grid grid-cols-2 gap-8 p-6 md:grid-cols-3 md:p-8">
          <Field label="Grid" value={grid != null ? `P${grid}` : null} />
          <Field label="Finish" value={finish != null ? `P${finish}` : (r?.status ?? null)} />
          <Field label="Points" value={points} />
          <Field label="Laps" value={laps} />
          <Field label="Team" value={r?.team ?? seed?.team} />
          <Field label="Fastest lap" value={r?.fastestLapTime ?? (seed?.fastestLap ? 'Yes' : '—')} />
        </dl>
      </section>

      {/* RACE DATA */}
      <section aria-labelledby="racedata" className="border-t border-line pt-10">
        <h2 id="racedata" className="display text-4xl md:text-6xl">Race data</h2>

        {state === 'loading' && <LoadingState label="LOADING RACE DATA" />}

        {state === 'unavailable' && (
          <div className="mt-6 space-y-6">
            <ErrorState
              title="SESSION DATA UNAVAILABLE"
              message="The data service is not reachable, so weather, tyre stints and position progression could not be loaded for this race. Any result shown above comes from the local snapshot."
              action={<Link href="/data-lab" className="btn btn-ghost">Open the Data Lab</Link>}
            />
            {seed?.tyres && (
              <figure className="panel p-6">
                <figcaption className="label mb-4">Tyre sequence · editorial snapshot</figcaption>
                <div className="flex flex-wrap gap-2">
                  {seed.tyres.map((t, i) => (
                    <span key={i} className="flex items-center gap-2 border border-line px-3 py-2 font-mono text-[11px] text-tech">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYRE_COLORS[t] ?? TYRE_COLORS.Unknown }} />
                      {t}
                    </span>
                  ))}
                </div>
                <SourceBadge className="mt-4" source="Editorial snapshot — stint laps require the session archive" />
              </figure>
            )}
          </div>
        )}

        {state === 'ok' && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <figure className="panel p-6">
              <figcaption className="label mb-4">Weather</figcaption>
              {data?.weather?.available ? (
                <dl className="grid grid-cols-2 gap-6">
                  <Field label="Air" value={`${data.weather.airTemp}°C`} />
                  <Field label="Track" value={`${data.weather.trackTemp}°C`} />
                  <Field label="Humidity" value={`${data.weather.humidity}%`} />
                  <Field label="Rain" value={data.weather.rainfall ? 'Yes' : 'No'} />
                </dl>
              ) : (
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  Weather data unavailable for this session
                </p>
              )}
            </figure>

            <figure className="panel p-6">
              <figcaption className="label mb-4">Tyre strategy</figcaption>
              {data?.tyres?.available && data.tyres.stints?.length ? (
                <StintBar stints={data.tyres.stints} colors={TYRE_COLORS}
                  totalLaps={Math.max(...data.tyres.stints.map((s) => s.to))} />
              ) : (
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  Stint data unavailable for this session
                </p>
              )}
            </figure>

            <figure className="panel p-6 lg:col-span-2">
              <figcaption className="label mb-4">Position progression</figcaption>
              {positions.length ? (
                <svg viewBox={`0 0 1000 200`} className="h-52 w-full" role="img"
                  aria-label="Track position by lap">
                  <g stroke="#222" strokeWidth="0.75">
                    {[0, 50, 100, 150, 200].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} />)}
                  </g>
                  <path
                    d={positions.map((p, i) =>
                      `${i ? 'L' : 'M'}${(i / (positions.length - 1)) * 1000} ${((p.position - 1) / 19) * 190 + 5}`).join(' ')}
                    fill="none" stroke="#C9A227" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
              ) : (
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  Position data unavailable for this session
                </p>
              )}
            </figure>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/data-lab?year=${year}&gp=${encodeURIComponent(circuitName?.split(' ')[0] ?? gp)}&session=Race&driver=HAM`}
            className="btn btn-ghost">Analyse in the Data Lab →</Link>
          <Link href={`/races?year=${year}`} className="btn btn-ghost">All {year} races →</Link>
        </div>
      </section>
    </div>
  );
}
