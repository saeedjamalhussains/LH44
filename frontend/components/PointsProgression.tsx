'use client';

import { useEffect, useState } from 'react';
import { LineChart, ChartFrame } from './charts';
import { ErrorState, LoadingState, SourceBadge } from './ui';

interface RaceRow {
  round: number; gp: string; points: number; finish: number | null; grid: number | null;
}

/**
 * Cumulative championship points, race by race.
 *
 * This chart needs per-race results, which live in the results API rather than
 * in the local season table — so rather than invent a progression, the page
 * states plainly that the series is unavailable when the service is off.
 */
export default function PointsProgression({
  year, finalPoints, rival, rivalPoints,
}: { year: number; finalPoints: number; rival?: string; rivalPoints?: number }) {
  const [state, setState] = useState<'loading' | 'ok' | 'unavailable'>('loading');
  const [rows, setRows] = useState<RaceRow[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/f1/driver/hamilton/races/${year}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const races: RaceRow[] = (data.races ?? []).filter((r: RaceRow) => r.round);
        if (cancelled) return;
        if (!races.length) { setState('unavailable'); return; }
        setRows(races.sort((a, b) => a.round - b.round));
        setState('ok');
      } catch {
        if (!cancelled) setState('unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, [year]);

  if (state === 'loading') return <LoadingState label="LOADING RACE RESULTS" />;

  if (state === 'unavailable') {
    return (
      <div className="space-y-6">
        <ErrorState
          title="POINTS PROGRESSION UNAVAILABLE"
          message={`Race-by-race points for ${year} are read from the results API, which is not reachable from this deployment. The season totals shown above come from the local snapshot and are unaffected. Start the data service to load the progression.`}
        />
        {rival && rivalPoints != null && (
          <ChartFrame title={`Final championship points · ${year}`} value={`+${finalPoints - rivalPoints}`}>
            <div className="flex h-full flex-col justify-center gap-6">
              {[
                { name: 'HAMILTON', pts: finalPoints, color: '#C9A227' },
                { name: rival.toUpperCase(), pts: rivalPoints, color: '#3A3F44' },
              ].map((d) => (
                <div key={d.name}>
                  <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
                    <span className="text-tech">{d.name}</span>
                    <span className="text-ink tabular">{d.pts}</span>
                  </div>
                  <div className="h-2 w-full bg-line">
                    <div className="h-full transition-all duration-1000"
                      style={{ width: `${(d.pts / Math.max(finalPoints, rivalPoints)) * 100}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartFrame>
        )}
      </div>
    );
  }

  let running = 0;
  const cumulative = rows.map((r) => {
    running += r.points ?? 0;
    return { x: r.round, y: running };
  });
  const perRace = rows.map((r) => ({ x: r.round, y: r.points ?? 0 }));
  const active = cursor != null ? rows[cursor] : null;

  return (
    <div className="space-y-6">
      <ChartFrame
        title={`Cumulative points · ${year}`}
        value={active ? `R${active.round} · ${cumulative[cursor!]?.y} pts` : `${running} pts`}
        yMax={Math.round(running)} yMin={0} height={220}
      >
        <LineChart
          ariaLabel={`Cumulative championship points across the ${year} season`}
          series={[{ id: 'ham', color: '#C9A227', points: cumulative, fill: true }]}
          cursorIndex={cursor} onCursor={setCursor} forceZero
        />
      </ChartFrame>

      <ChartFrame
        title={`Points per race · ${year}`}
        value={active ? `${active.gp} · ${active.points} pts` : `${rows.length} rounds`}
        yMax={Math.max(...perRace.map((p) => p.y))} yMin={0} height={140}
      >
        <LineChart
          ariaLabel={`Points scored in each round of the ${year} season`}
          series={[{ id: 'race', color: '#F4F4F4', points: perRace }]}
          cursorIndex={cursor} onCursor={setCursor} forceZero
        />
      </ChartFrame>

      {active && (
        <dl className="grid grid-cols-4 gap-4 border border-line bg-panel p-4 font-mono text-xs">
          {[['Round', active.round], ['Grid', active.grid ?? '—'],
            ['Finish', active.finish ?? 'DNF'], ['Points', active.points]].map(([k, v]) => (
            <div key={k as string}>
              <dt className="label">{k}</dt>
              <dd className="mt-1 text-lg text-ink tabular">{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      <SourceBadge source="Jolpica F1 API" />
    </div>
  );
}
