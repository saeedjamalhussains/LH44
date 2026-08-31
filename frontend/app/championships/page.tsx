import type { Metadata } from 'next';
import Link from 'next/link';
import ChampionshipScroll from '@/components/ChampionshipScroll';
import { Reveal, SectionHeader, StatCounter } from '@/components/ui';
import { championships, meta } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Seven Championships',
  description:
    "Lewis Hamilton's seven Formula 1 World Championships — 2008, 2014, 2015, 2017, 2018, 2019 and 2020 — with points, margins and the race that decided each one.",
};

export default function ChampionshipsPage() {
  const totals = championships.reduce(
    (a, c) => ({
      points: a.points + c.points, wins: a.wins + c.wins,
      poles: a.poles + c.poles, podiums: a.podiums + c.podiums,
    }),
    { points: 0, wins: 0, poles: 0, podiums: 0 },
  );

  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="World championships" title="Seven Times." accent="text-gold"
          sub="2008, 2014, 2015, 2017, 2018, 2019, 2020. One decided by a point, one by 124."
        />
        <dl className="grid grid-cols-2 gap-8 border-y border-line py-12 md:grid-cols-4">
          {[
            ['Championship points', totals.points], ['Wins in title years', totals.wins],
            ['Poles in title years', totals.poles], ['Podiums in title years', totals.podiums],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="label">{k}</dt>
              <dd className="display mt-3 text-5xl text-gold md:text-7xl">
                <StatCounter value={v as number} />
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <ChampionshipScroll championships={championships} />

      <section className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 className="display text-4xl md:text-6xl">Every title, in detail</h2>
            <p className="mt-3 max-w-2xl text-tech">
              Full season breakdowns, points progression and the margin over the closest rival.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {championships.map((c) => (
              <li key={c.year} className="bg-noir">
                <Link href={`/championships/${c.year}`}
                  className="group flex h-full flex-col justify-between p-7 transition-colors hover:bg-panel">
                  <span className="display text-6xl text-gold">{c.year}</span>
                  <span className="mt-6 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {c.team} · +{c.margin} over {c.rival}
                  </span>
                  <span className="mt-3 font-mono text-[11px] text-tech group-hover:text-ink">
                    Open detail →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Source: {meta.sources.career.label} · {meta.updatedAt}
          </p>
        </div>
      </section>
    </div>
  );
}
