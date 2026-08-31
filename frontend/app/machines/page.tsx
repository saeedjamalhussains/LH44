import type { Metadata } from 'next';
import Link from 'next/link';
import ImagePlate from '@/components/ImagePlate';
import RightsNote from '@/components/RightsNote';
import { Reveal, SectionHeader, SourceBadge } from '@/components/ui';
import { meta, seasons } from '@/lib/data';

export const metadata: Metadata = {
  title: 'The Machines',
  description:
    'Every Formula 1 car Lewis Hamilton has raced, from the McLaren MP4-22 to the Ferrari SF-26, with engine, championship result and season record.',
};

const ACCENT = { mclaren: '#9BA1A6', mercedes: '#B8B8B8', ferrari: '#D40000' } as const;

export default function MachinesPage() {
  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Machinery" title="The Machines"
          sub={`${seasons.length} cars across three teams and four engine regulation eras.`}
        />
      </header>

      <ol className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        {seasons.map((s, i) => (
          <li key={s.year} id={String(s.year)} className="scroll-mt-24 border-t border-line last:border-b">
            <Reveal delay={0.02 * (i % 6)}>
              <article className="grid gap-8 py-10 lg:grid-cols-[8rem_1fr_16rem] lg:items-start lg:gap-12">
                <p className={`display text-6xl lg:text-7xl ${s.champion ? 'text-gold' : 'text-ink'}`}>
                  {s.year}
                </p>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: ACCENT[s.era] }}>{s.team}</p>
                  <h2 className="display mt-2 text-3xl md:text-5xl">{s.car}</h2>
                  <p className="mt-2 font-mono text-xs text-muted">{s.engine}</p>

                  <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-line pt-6 sm:grid-cols-5">
                    {[
                      ['Championship', s.champion ? 'P1' : `P${s.position}`],
                      ['Wins', s.wins], ['Poles', s.poles], ['Podiums', s.podiums], ['Points', s.points],
                    ].map(([k, v], j) => (
                      <div key={k as string}>
                        <dt className="label">{k as string}</dt>
                        <dd className={`display mt-2 text-3xl ${j === 0 && s.champion ? 'text-gold' : ''}`}>
                          {v as string}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-6 max-w-2xl text-sm leading-relaxed text-tech">{s.keyMoment}</p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/numbers?season=${s.year}`} className="btn btn-ghost">View season</Link>
                    {s.champion && (
                      <Link href={`/championships/${s.year}`} className="btn btn-gold">Championship</Link>
                    )}
                  </div>
                </div>

                <ImagePlate
                  car={s.year}
                  caption={`${s.car} — ${s.team}, ${s.year}.`}
                  accent={ACCENT[s.era]} aspect="16 / 10"
                  sizes="(min-width: 1024px) 16rem, 100vw"
                  tone={s.era === 'ferrari' ? 2 : s.era === 'mercedes' ? 1 : 0}
                />
              </article>
            </Reveal>
          </li>
        ))}
      </ol>

      <div className="mx-auto max-w-[1600px] space-y-5 px-5 pb-16 md:px-10">
        <SourceBadge source={meta.sources.seasons.label} updatedAt={meta.updatedAt} />
        <RightsNote />
      </div>
    </div>
  );
}
