'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart } from './charts';
import { SourceBadge, StatCounter } from './ui';
import { ordinal } from '@/lib/format';
import type { Season } from '@/lib/types';

const METRICS = [
  { key: 'points', label: 'Points' },
  { key: 'wins', label: 'Wins' },
  { key: 'poles', label: 'Poles' },
  { key: 'podiums', label: 'Podiums' },
  { key: 'avgGrid', label: 'Avg qualifying' },
  { key: 'avgFinish', label: 'Avg finish' },
] as const;

type MetricKey = (typeof METRICS)[number]['key'];

function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  if (!Number.isFinite(value) || value === 0) {
    return <span className="font-mono text-[10px] text-muted">—</span>;
  }
  const good = invert ? value < 0 : value > 0;
  return (
    <span className={`font-mono text-[10px] tabular ${good ? 'text-gold' : 'text-silver'}`}>
      {value > 0 ? '+' : ''}{Math.round(value * 10) / 10}
    </span>
  );
}

export default function SeasonAnalyzer({
  seasons, source, updatedAt,
}: { seasons: Season[]; source: string; updatedAt: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const fromUrl = Number(params.get('season'));
  const initial = seasons.some((s) => s.year === fromUrl) ? fromUrl : seasons[seasons.length - 1].year;

  const [year, setYear] = useState(initial);
  const [metric, setMetric] = useState<MetricKey>('points');

  const season = useMemo(() => seasons.find((s) => s.year === year)!, [seasons, year]);
  const previous = useMemo(
    () => seasons.filter((s) => s.year < year).slice(-1)[0], [seasons, year]);

  const select = (next: number) => {
    setYear(next);
    router.replace(`/numbers?season=${next}`, { scroll: false });
  };

  const chartData = seasons.map((s) => ({
    label: String(s.year),
    value: Number(s[metric]),
    highlight: s.year === year,
  }));

  const isRate = metric === 'avgGrid' || metric === 'avgFinish';

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <label htmlFor="season-select" className="label">Select season</label>
          <div className="mt-3 flex items-center gap-4">
            <select
              id="season-select"
              value={year}
              onChange={(e) => select(Number(e.target.value))}
              className="border border-line bg-panel px-4 py-3 font-mono text-sm text-ink
                focus:border-gold focus:outline-none"
            >
              {[...seasons].reverse().map((s) => (
                <option key={s.year} value={s.year}>
                  {s.year} · {s.team}{s.champion ? ' · Champion' : ''}
                </option>
              ))}
            </select>
            {previous && (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Compared with {previous.year}
              </span>
            )}
          </div>
        </div>

        <div className="scroll-x -mx-5 flex gap-px px-5 md:mx-0 md:px-0">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              aria-pressed={metric === m.key}
              className={`shrink-0 border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em]
                transition-colors ${metric === m.key
                  ? 'border-ink bg-ink text-noir' : 'border-line text-muted hover:text-ink'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={year}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-10"
      >
        <div className="panel p-6 md:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="display text-[16vw] leading-none md:text-[8rem]">{season.year}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {season.team} · {season.car}
                {season.inProgress && <span className="ml-3 text-ferrari-bright">Season in progress</span>}
              </p>
            </div>
            <p className={`display text-5xl md:text-7xl ${season.champion ? 'text-gold' : 'text-tech'}`}>
              {season.champion ? 'CHAMPION' : ordinal(season.position)}
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4 lg:grid-cols-8">
            {([
              ['Points', 'points'], ['Starts', 'starts'], ['Wins', 'wins'], ['Poles', 'poles'],
              ['Podiums', 'podiums'], ['Fastest laps', 'fastestLaps'], ['Retirements', 'dnfs'],
              ['Avg grid', 'avgGrid'],
            ] as [string, keyof Season][]).map(([label, key]) => {
              const value = Number(season[key]);
              const prev = previous ? Number(previous[key]) : NaN;
              return (
                <div key={label}>
                  <dt className="label">{label}</dt>
                  <dd className="display mt-2 text-3xl md:text-4xl">
                    <StatCounter value={value} decimals={Number.isInteger(value) ? 0 : 1} />
                  </dd>
                  <dd className="mt-1">
                    <Delta value={value - prev} invert={key === 'dnfs' || key === 'avgGrid'} />
                    <span className="ml-1 font-mono text-[9px] text-muted">vs {previous?.year ?? '—'}</span>
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-8 border-t border-line pt-6">
            <p className="label">Key moment</p>
            <p className="mt-2 max-w-3xl leading-relaxed text-tech">{season.keyMoment}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
            <Link href={`/races?year=${season.year}`} className="btn btn-ghost">Race results</Link>
            {season.champion && (
              <Link href={`/championships/${season.year}`} className="btn btn-gold">Championship detail</Link>
            )}
            <Link href={`/machines#${season.year}`} className="btn btn-ghost">{season.car}</Link>
          </div>
        </div>

        <figure className="panel mt-6 p-6 md:p-8">
          <figcaption className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <span className="label">
              {METRICS.find((m) => m.key === metric)?.label} by season · 2007–{seasons[seasons.length - 1].year}
            </span>
            <span className="font-mono text-[10px] text-muted">
              {isRate ? 'Lower is better' : 'Selected season highlighted'}
            </span>
          </figcaption>
          <BarChart
            data={chartData}
            ariaLabel={`${metric} for every Hamilton season, ${season.year} highlighted`}
            onSelect={(label) => select(Number(label))}
            selected={String(year)}
            color="#C9A227"
            formatValue={(n) => (isRate ? n.toFixed(1) : String(n))}
          />
          <div className="mt-3 flex justify-between font-mono text-[9px] text-muted tabular">
            <span>{seasons[0].year}</span>
            <span>{seasons[seasons.length - 1].year}</span>
          </div>
          <SourceBadge className="mt-6" source={source} updatedAt={updatedAt}
            calculated={isRate} />
        </figure>
      </motion.div>
    </div>
  );
}
