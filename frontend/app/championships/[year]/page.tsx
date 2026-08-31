import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PointsProgression from '@/components/PointsProgression';
import { Reveal, SourceBadge, StatCounter } from '@/components/ui';
import ImagePlate from '@/components/ImagePlate';
import { championships, championshipFor, meta, seasonFor } from '@/lib/data';
import { ordinal } from '@/lib/format';

export function generateStaticParams() {
  return championships.map((c) => ({ year: String(c.year) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ year: string }> },
): Promise<Metadata> {
  const { year } = await params;
  const c = championshipFor(Number(year));
  if (!c) return { title: 'Championship not found' };
  return {
    title: `${c.year} World Championship`,
    description: `Lewis Hamilton's ${c.year} Formula 1 World Championship with ${c.team}: ${c.points} points, ${c.wins} wins, ${c.poles} poles, decided by ${c.margin} over ${c.rival}.`,
  };
}

export default async function ChampionshipDetail({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const c = championshipFor(Number(year));
  const s = seasonFor(Number(year));
  if (!c || !s) notFound();

  const index = championships.findIndex((x) => x.year === c.year);
  const prev = championships[index - 1];
  const next = championships[index + 1];

  return (
    <article className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Reveal>
          <Link href="/championships" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted hover:text-ink">
            ← All championships
          </Link>
          <h1 className="display mt-6 text-[34vw] leading-[0.78] text-gold md:text-[20rem]">
            {c.year}<span className="sr-only"> Formula 1 World Championship</span>
          </h1>
          <p className="display mt-2 text-[9vw] leading-none md:text-6xl">World Champion</p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            {c.team} · {s.car} · Championship {ordinal(index + 1)} of seven
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="mt-14 grid grid-cols-2 gap-8 border-y border-line py-10 md:grid-cols-6">
            {[
              ['Points', c.points], ['Wins', c.wins], ['Poles', c.poles],
              ['Podiums', c.podiums], ['Fastest laps', c.fastestLaps], ['Margin', c.margin],
            ].map(([k, v], i) => (
              <div key={k as string}>
                <dt className="label">{k}</dt>
                <dd className={`display mt-3 text-4xl md:text-6xl ${i === 5 ? 'text-gold' : ''}`}>
                  {i === 5 ? '+' : ''}<StatCounter value={v as number} />
                </dd>
              </div>
            ))}
          </dl>
          <SourceBadge className="mt-4" source={meta.sources.career.label} updatedAt={meta.updatedAt} />
        </Reveal>
      </header>

      <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="display text-[11vw] leading-[0.9] text-ink md:text-6xl">{c.line}</p>
              <p className="label mt-10">Defining moment</p>
              <p className="mt-3 max-w-2xl text-lg leading-[1.7] text-tech">{c.definingMoment}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-line pt-8 md:grid-cols-3">
                {[
                  ['Clinched at', c.clinched], ['Closest rival', `${c.rival} · ${c.rivalPoints} pts`],
                  ['Teammate', s.teammate], ['Starts', String(s.starts)],
                  ['Average grid', s.avgGrid.toFixed(1)], ['Average finish', s.avgFinish.toFixed(1)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="label">{k}</dt>
                    <dd className="mt-2 text-sm text-tech">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <ImagePlate
              slot={c.year <= 2012 ? 'mclaren-alt' : c.year >= 2018 ? 'mercedes-alt' : 'mercedes'}
              caption={`${c.year} — championship-winning season with ${c.team}.`}
              accent="#C9A227" aspect="4 / 5"
              sizes="(min-width: 1024px) 38vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="charts" className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 id="charts" className="display text-4xl md:text-6xl">Championship data</h2>
            <p className="mt-3 max-w-2xl text-tech">
              Points by race, and the margin over {c.rival}. Read live from the results API.
            </p>
          </Reveal>
          <div className="mt-10">
            <PointsProgression year={c.year} finalPoints={c.points} rival={c.rival} rivalPoints={c.rivalPoints} />
          </div>
        </div>
      </section>

      <nav aria-label="Championship navigation"
        className="mx-auto flex max-w-[1600px] flex-wrap justify-between gap-4 px-5 py-16 md:px-10">
        {prev ? (
          <Link href={`/championships/${prev.year}`} className="btn btn-ghost">← {prev.year}</Link>
        ) : <span />}
        <Link href={`/races?year=${c.year}`} className="btn btn-ghost">{c.year} race results →</Link>
        {next ? (
          <Link href={`/championships/${next.year}`} className="btn btn-gold">{next.year} →</Link>
        ) : <span />}
      </nav>
    </article>
  );
}
