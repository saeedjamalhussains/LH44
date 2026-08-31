import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import SeasonAnalyzer from '@/components/SeasonAnalyzer';
import { LoadingState, Reveal, SectionHeader, StatBlock, SourceBadge } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { career, circuits, derivedStats, headlineStats, meta, seasons, totalStats } from '@/lib/data';

export const metadata: Metadata = {
  title: 'The Numbers',
  description:
    'Every Lewis Hamilton career statistic: wins, poles, podiums, points and derived rates, with a season-by-season analyser and clear sourcing.',
};

export default function NumbersPage() {
  const topCircuits = [...circuits].sort((a, b) => b.wins - a.wins).slice(0, 12);

  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Statistical archive" title="The Numbers"
          sub="Career, season, team and circuit. Every figure is derived from the season table, so the totals and the detail can never disagree."
        />
        <div className="grid grid-cols-2 gap-8 border-y border-line py-12 md:grid-cols-4">
          {headlineStats.map((s, i) => (
            <StatBlock key={s.label} stat={s} size="sm" accent={i === 0 ? 'text-gold' : 'text-ink'} />
          ))}
        </div>
      </header>

      <section aria-labelledby="career-totals" className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
        <Reveal>
          <h2 id="career-totals" className="display text-4xl md:text-6xl">Career totals</h2>
          <p className="mt-3 max-w-2xl text-tech">
            Summed across {career.seasons} seasons, from the 2007 Australian Grand Prix to the current round.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-10 md:grid-cols-5">
          {totalStats.map((s) => <StatBlock key={s.label} stat={s} size="sm" />)}
        </div>
      </section>

      <section aria-labelledby="derived" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
          <Reveal>
            <h2 id="derived" className="display text-4xl md:text-6xl">Calculated metrics</h2>
            <p className="mt-3 max-w-2xl text-tech">
              These are not published totals. Each one is computed from the season table and marked
              <span className="mx-2 border border-silver-dim px-1 py-0.5 font-mono text-[9px] text-silver">CALC</span>
              wherever it appears on this site.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-7">
            {derivedStats.map((s) => <StatBlock key={s.label} stat={s} size="sm" accent="text-silver" />)}
          </div>
        </div>
      </section>

      <section aria-labelledby="analyser" className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
        <Reveal>
          <p className="eyebrow">Season analyser</p>
          <h2 id="analyser" className="display mt-3 text-4xl md:text-6xl">Any season, compared</h2>
          <p className="mt-3 max-w-2xl text-tech">
            Select a year to see its full record and the change against the season before it.
          </p>
        </Reveal>
        <div className="mt-12">
          <Suspense fallback={<LoadingState label="LOADING SEASON DATA" />}>
            <SeasonAnalyzer seasons={seasons} source={meta.sources.seasons.label} updatedAt={meta.updatedAt} />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="by-circuit" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
          <Reveal>
            <h2 id="by-circuit" className="display text-4xl md:text-6xl">Wins by circuit</h2>
            <p className="mt-3 max-w-2xl text-tech">The twelve circuits with the most Hamilton victories.</p>
          </Reveal>
          <figure className="panel mt-10 p-6 md:p-8">
            <BarChart
              data={topCircuits.map((c) => ({ label: c.name.split(' ')[0], value: c.wins }))}
              ariaLabel="Hamilton wins by circuit" color="#C9A227"
            />
            <div className="scroll-x mt-3 flex gap-[2px]">
              {topCircuits.map((c) => (
                <span key={c.id} className="flex-1 text-center font-mono text-[8px] uppercase text-muted">
                  {c.name.split(' ')[0].slice(0, 6)}
                </span>
              ))}
            </div>
            <SourceBadge className="mt-6"
              source="Jolpica F1 API — computed from every Hamilton race result" />
          </figure>
          <Reveal>
            <Link href="/circuits" className="btn btn-ghost mt-10">Every circuit →</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
