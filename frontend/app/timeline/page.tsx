import type { Metadata } from 'next';
import CareerTimeline from '@/components/CareerTimeline';
import { DataTimestamp, Reveal, SectionHeader } from '@/components/ui';
import { eras, eraTotals, meta, seasons } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Career Timeline',
  description:
    "Lewis Hamilton's Formula 1 career season by season, from the 2007 debut to the current Ferrari campaign, with results, key moments and machinery for every year.",
};

export default function TimelinePage() {
  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Career" title="The Journey"
          sub="From karting prodigy to seven-time world champion and Ferrari driver. Select any season to open its full record."
        />
        <div className="grid gap-px border border-line bg-line md:grid-cols-3">
          {eras.map((e) => {
            const t = eraTotals(e.id);
            return (
              <div key={e.id} className="bg-noir p-6">
                <p className="label">Era {e.index}</p>
                <p className={`display mt-2 text-4xl ${e.id === 'ferrari' ? 'text-ferrari-bright' : 'text-ink'}`}>
                  {e.team}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-muted">{e.span}</p>
                <p className="mt-4 font-mono text-xs text-tech tabular">
                  {t.titles} titles · {t.wins} wins · {t.poles} poles · {t.podiums} podiums
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-6"><DataTimestamp updatedAt={meta.updatedAt} /></div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
        <CareerTimeline seasons={seasons} />
      </div>

      <section className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <p className="display text-3xl md:text-5xl">A different era. A different challenge.</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-tech">
              The timeline above is generated from the season table. When a new round is added to the
              data layer, this page — and every total on this site — moves with it.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
