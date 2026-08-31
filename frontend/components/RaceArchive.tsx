'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingState, SourceBadge } from './ui';
import { slug } from '@/lib/format';

interface Race {
  id: string; year: number; round?: number; gp: string; circuit: string; circuitName?: string;
  team: string | null; grid: number | null; finish: number | null; points: number;
  fastestLap?: boolean; status?: string; quali?: number; tyres?: string[];
}

type Filter = 'all' | 'wins' | 'podiums' | 'poles';

/**
 * Full searchable race archive.
 *
 * The complete 392-race record lives in the results API. When that service is
 * offline the archive falls back to the featured races bundled with the site
 * and says so — it never presents a partial archive as a complete one.
 */
export default function RaceArchive({ fallback, seedNote }: { fallback: Race[]; seedNote: string }) {
  const params = useSearchParams();
  const [races, setRaces] = useState<Race[]>(fallback);
  const [state, setState] = useState<'loading' | 'live' | 'degraded'>('loading');
  const [query, setQuery] = useState('');
  const [year, setYear] = useState(params.get('year') ?? 'all');
  const [team, setTeam] = useState('all');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/f1/driver/hamilton/races');
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;
        if (data.available && data.races?.length) {
          setRaces(data.races); setState('live');
        } else { setState('degraded'); }
      } catch {
        if (!cancelled) setState('degraded');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const years = useMemo(
    () => Array.from(new Set(races.map((r) => r.year))).sort((a, b) => b - a), [races]);
  const teams = useMemo(
    () => Array.from(new Set(races.map((r) => r.team).filter(Boolean))) as string[], [races]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return races
      .filter((r) => (year === 'all' ? true : r.year === Number(year)))
      .filter((r) => (team === 'all' ? true : r.team === team))
      .filter((r) => {
        if (filter === 'wins') return r.finish === 1;
        if (filter === 'podiums') return r.finish != null && r.finish <= 3;
        if (filter === 'poles') return r.grid === 1;
        return true;
      })
      .filter((r) => !q || `${r.gp} ${r.circuitName ?? ''} ${r.circuit} ${r.year}`.toLowerCase().includes(q))
      .sort((a, b) => b.year - a.year || (b.round ?? 0) - (a.round ?? 0));
  }, [races, query, year, team, filter]);

  if (state === 'loading') return <LoadingState label="LOADING RACE ARCHIVE" />;

  const won = rows.filter((r) => r.finish === 1).length;
  const podium = rows.filter((r) => r.finish != null && r.finish <= 3).length;
  const points = Math.round(rows.reduce((a, r) => a + (r.points ?? 0), 0) * 10) / 10;

  return (
    <div>
      {state === 'degraded' && (
        <div role="status" className="mb-8 border border-silver-dim bg-panel p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-silver">
            Partial archive
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            The results API is unreachable, so this page is showing the {fallback.length} featured
            races bundled with the site rather than the full record. {seedNote}
          </p>
        </div>
      )}

      {/* CONTROLS */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="race-search" className="label block">Search</label>
            <input
              id="race-search" type="search" value={query} placeholder="Silverstone, Brazil, 2008…"
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full border border-line bg-noir px-3 py-2.5 font-mono text-xs
                text-ink placeholder:text-muted focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="race-year" className="label block">Year</label>
            <select id="race-year" value={year} onChange={(e) => setYear(e.target.value)}
              className="mt-2 border border-line bg-noir px-3 py-2.5 font-mono text-xs text-ink focus:border-gold focus:outline-none">
              <option value="all">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="race-team" className="label block">Team</label>
            <select id="race-team" value={team} onChange={(e) => setTeam(e.target.value)}
              className="mt-2 border border-line bg-noir px-3 py-2.5 font-mono text-xs text-ink focus:border-gold focus:outline-none">
              <option value="all">All teams</option>
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-px">
            {(['all', 'wins', 'podiums', 'poles'] as Filter[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
                className={`border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  filter === f ? 'border-ink bg-ink text-noir' : 'border-line text-muted hover:text-ink'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-3 border-t border-line pt-4 font-mono text-xs">
          {[['Races', rows.length], ['Wins', won], ['Podiums', podium], ['Points', points]].map(([k, v]) => (
            <div key={k as string} className="flex items-baseline gap-2">
              <dt className="label">{k as string}</dt>
              <dd className="text-lg text-ink tabular">{v as number}</dd>
            </div>
          ))}
        </dl>
        {state === 'live' && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Points here sum Grand Prix classifications only. The results API records sprint results
            separately, so this figure sits below the published career total by the value of those
            sprint finishes.
          </p>
        )}
      </div>

      {/* TABLE — desktop */}
      <div className="mt-6 hidden md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">Lewis Hamilton race results</caption>
          <thead>
            <tr className="border-y border-line">
              {['Year', 'Grand Prix', 'Team', 'Grid', 'Finish', 'Pts', 'FL', ''].map((h) => (
                <th key={h} scope="col" className="label py-3 text-left first:pl-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.year}-${r.circuit}-${r.round ?? r.gp}`}
                className="border-b border-line transition-colors hover:bg-panel">
                <td className="py-3 pl-2 font-display text-2xl">{r.year}</td>
                <td className="py-3">
                  <Link href={`/races/${r.year}/${r.circuit || slug(r.gp)}`}
                    className="text-sm text-ink hover:text-gold">{r.gp}</Link>
                  <span className="ml-2 font-mono text-[10px] text-muted">{r.circuitName ?? ''}</span>
                </td>
                <td className="py-3 font-mono text-[11px] text-muted">{r.team ?? '—'}</td>
                <td className="py-3 font-mono text-sm text-tech tabular">{r.grid ?? '—'}</td>
                <td className={`py-3 font-display text-2xl tabular ${
                  r.finish === 1 ? 'text-gold' : r.finish != null && r.finish <= 3 ? 'text-ink' : 'text-muted'}`}>
                  {r.finish ?? 'DNF'}
                </td>
                <td className="py-3 font-mono text-sm text-tech tabular">{r.points}</td>
                <td className="py-3 font-mono text-xs">{r.fastestLap ? <span className="text-gold">FL</span> : ''}</td>
                <td className="py-3 pr-2 text-right">
                  <Link href={`/races/${r.year}/${r.circuit || slug(r.gp)}`}
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
                    Detail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="py-16 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            No races match these filters
          </p>
        )}
      </div>

      {/* CARDS — mobile */}
      <ul className="mt-6 space-y-px md:hidden">
        {rows.map((r) => (
          <li key={`${r.year}-${r.circuit}-${r.round ?? r.gp}`}>
            <Link href={`/races/${r.year}/${r.circuit || slug(r.gp)}`} className="block border border-line bg-panel p-4">
              <div className="flex items-baseline justify-between">
                <span className="display text-3xl">{r.year}</span>
                <span className={`display text-3xl ${r.finish === 1 ? 'text-gold' : 'text-tech'}`}>
                  P{r.finish ?? '—'}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink">{r.gp}</p>
              <dl className="mt-3 flex gap-6 border-t border-line pt-3 font-mono text-[10px]">
                {[['Team', r.team ?? '—'], ['Grid', r.grid ?? '—'], ['Pts', r.points]].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="label">{k as string}</dt>
                    <dd className="mt-1 text-tech">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          </li>
        ))}
        {!rows.length && (
          <li className="py-16 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            No races match these filters
          </li>
        )}
      </ul>

      <SourceBadge className="mt-8"
        source={state === 'live' ? 'Jolpica F1 API' : 'Local seed snapshot — featured races only'} />
    </div>
  );
}
