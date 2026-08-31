import type { Metadata } from 'next';
import Link from 'next/link';
import FerrariOpening from '@/components/FerrariOpening';
import ImagePlate from '@/components/ImagePlate';
import RightsNote from '@/components/RightsNote';
import { StintBar } from '@/components/charts';
import { Reveal, SourceBadge, StatCounter } from '@/components/ui';
import { barcelona, eraSeasons, eraTotals, meta, seasonFor } from '@/lib/data';
import { TYRE_COLORS } from '@/lib/format';

export const metadata: Metadata = {
  title: 'The Red Chapter',
  description:
    "Lewis Hamilton at Ferrari: the 2025 debut season, the 2026 campaign and the Barcelona victory that became his 106th Grand Prix win.",
};

export default function FerrariPage() {
  const s2025 = seasonFor(2025)!;
  const s2026 = seasonFor(2026)!;
  const totals = eraTotals('ferrari');

  return (
    <div>
      <FerrariOpening />

      <section aria-labelledby="red-intro" className="border-t border-line bg-noir py-20 md:py-28">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h1 id="red-intro" className="display text-[13vw] leading-[0.84] text-ferrari-bright md:text-[7rem]">
              A different era.<br />A different challenge.
            </h1>
            <div className="prose-editorial mt-10 max-w-2xl">
              <p>
                Hamilton joined Ferrari for the 2025 season, after twelve years and six world
                championships with Mercedes. He was forty years old, and the move was not one that
                any performance model recommended.
              </p>
              <p>
                The first year produced a sprint pole and a sprint win in Shanghai in the third
                weekend, and no Grand Prix podium across the rest of the season. The second produced
                a victory at Barcelona-Catalunya. The chapter is open, and every figure on this page
                moves as it continues.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-14 grid grid-cols-2 gap-8 border-y border-line py-10 sm:grid-cols-3 lg:grid-cols-5">
              {[
                ['Seasons', totals.seasons], ['Starts', totals.starts],
                ['Wins', totals.wins], ['Podiums', totals.podiums], ['Points', totals.points],
              ].map(([k, v], i) => (
                <div key={k as string}>
                  <dt className="label">{k as string}</dt>
                  <dd className={`display mt-3 text-4xl md:text-6xl ${i === 2 ? 'text-ferrari-bright' : ''}`}>
                    <StatCounter value={v as number} decimals={Number.isInteger(v as number) ? 0 : 1} />
                  </dd>
                </div>
              ))}
            </dl>
            <SourceBadge className="mt-4" source={meta.sources.career.label} updatedAt={meta.updatedAt} />
          </Reveal>
        </div>
      </section>

      {/* THE TWO SEASONS */}
      <section aria-labelledby="seasons" className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <h2 id="seasons" className="sr-only">Ferrari seasons</h2>
          <div className="grid gap-px border border-line bg-line lg:grid-cols-2">
            {[
              { s: s2025, title: 'First Ferrari season',
                text: 'A year spent adapting to a car built around a different driver, and to a team culture with its own gravity. The sprint win in Shanghai came in the third weekend. It was the high point of the season.' },
              { s: s2026, title: 'The resurgence',
                text: `New regulations, a new car, and a return to the front. P${s2026.position} in the championship after ${s2026.starts} rounds, with ${s2026.podiums} podiums and a victory.` },
            ].map(({ s, title, text }) => (
              <Reveal key={s.year} className="bg-noir">
                <article className="h-full p-8 md:p-12">
                  <p className="display text-[18vw] leading-none text-ferrari md:text-[9rem]">{s.year}</p>
                  <p className="display mt-3 text-2xl md:text-4xl">{title}</p>
                  {s.inProgress && (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ferrari-bright">
                      Season in progress · figures update with the data layer
                    </p>
                  )}
                  <dl className="mt-8 grid grid-cols-3 gap-5 border-y border-line py-6">
                    {[['Championship', `P${s.position}`], ['Points', s.points], ['Starts', s.starts],
                      ['Wins', s.wins], ['Podiums', s.podiums], ['Poles', s.poles]].map(([k, v]) => (
                      <div key={k as string}>
                        <dt className="label">{k as string}</dt>
                        <dd className="display mt-2 text-3xl">{v as string}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-6 text-sm leading-relaxed text-tech">{text}</p>
                  <p className="mt-4 border-l-2 border-ferrari pl-4 text-sm leading-relaxed text-muted">
                    {s.keyMoment}
                  </p>
                  <Link href={`/numbers?season=${s.year}`} className="btn btn-red mt-8">
                    Analyse {s.year} →
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BARCELONA 2026 */}
      <section id="barcelona" aria-labelledby="barca"
        className="scroll-mt-20 border-t border-line bg-gradient-to-b from-[#1A0203] to-noir py-20 md:py-28">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <p className="eyebrow">Feature · {barcelona.gp}</p>
            <h2 id="barca" className="display mt-4 text-[24vw] leading-[0.78] text-ferrari-bright md:text-[13rem]">
              The 106th.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-tech">
              Hamilton&apos;s first Ferrari Grand Prix victory. {barcelona.circuit}, {barcelona.year},
              from P{barcelona.grid} on the grid, {barcelona.laps} laps, won by {barcelona.gap}.
            </p>
            <SourceBadge className="mt-4" source={meta.sources.career.label} updatedAt={meta.updatedAt} />
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-14 grid grid-cols-2 gap-8 border-y border-line py-10 sm:grid-cols-3 lg:grid-cols-5">
              {[
                ['Grid', `P${barcelona.grid}`], ['Finish', `P${barcelona.finish}`],
                ['Points', String(barcelona.points)], ['Laps', String(barcelona.laps)],
                ['Margin', barcelona.gap],
              ].map(([k, v], i) => (
                <div key={k} className="min-w-0">
                  <dt className="label">{k}</dt>
                  {/* The margin is a far longer string than the other four values,
                      so it takes a smaller step on the type scale. */}
                  <dd className={`display mt-3 ${v.length > 5 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl'} ${
                    i === 1 ? 'text-ferrari-bright' : ''}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <h3 className="display text-3xl md:text-5xl">Race timeline</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Confirmed from the official classification: second on the grid, first at the flag,
                  66 laps, +{barcelona.gap.replace('+', '')}. The lap-by-lap reconstruction below is
                  editorial and is replaced by session data when the archive is reachable.
                </p>
              </Reveal>
              <ol className="mt-8 border-t border-line">
                {barcelona.timeline.map((t, i) => (
                  <Reveal key={t.lap} delay={0.04 * i}>
                    <li className="grid grid-cols-[4rem_1fr] gap-5 border-b border-line py-5">
                      <span className="display text-2xl text-ferrari">L{t.lap}</span>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink">{t.label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-tech">{t.text}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>

            <div className="space-y-6">
              <Reveal>
                <figure className="panel p-6">
                  <figcaption className="mb-4 flex items-baseline justify-between">
                    <span className="label">Position by lap</span>
                    <span className="border border-silver-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-silver">
                      Reconstruction
                    </span>
                  </figcaption>
                  <svg viewBox="0 0 660 160" className="w-full" role="img"
                    aria-label="Hamilton's track position across 66 laps at Barcelona, reconstructed">
                    <g stroke="#222" strokeWidth="0.75">
                      {[0, 40, 80, 120, 160].map((y) => <line key={y} x1="0" x2="660" y1={y} y2={y} />)}
                    </g>
                    <path
                      d={barcelona.positionByLap.map((p, i) =>
                        `${i ? 'L' : 'M'}${(i / (barcelona.positionByLap.length - 1)) * 660} ${(p - 1) * 40 + 6}`).join(' ')}
                      fill="none" stroke="#D40000" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="mt-2 flex justify-between font-mono text-[9px] text-muted">
                    <span>LAP 1</span><span>P1 top · P4 bottom</span><span>LAP {barcelona.laps}</span>
                  </div>
                </figure>
              </Reveal>

              <Reveal delay={0.1}>
                <figure className="panel p-6">
                  <figcaption className="mb-4 flex items-baseline justify-between">
                    <span className="label">Tyre strategy</span>
                    <span className="border border-silver-dim px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-silver">
                      Reconstruction
                    </span>
                  </figcaption>
                  <StintBar stints={barcelona.stints} totalLaps={barcelona.laps} colors={TYRE_COLORS} />
                </figure>
              </Reveal>

              <Reveal delay={0.15}>
                <ImagePlate slot="ferrari-2026-fp"
                  caption="Hamilton in the Ferrari, 2026."
                  accent="#D40000" aspect="16 / 10" tone={2}
                  sizes="(min-width: 1024px) 46vw, 100vw" />
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-20 flex flex-wrap items-end gap-x-12 gap-y-6 border-t border-line pt-14">
              <p className="display text-[26vw] leading-[0.78] text-ferrari md:text-[14rem]">44</p>
              <div>
                <p className="display text-[20vw] leading-[0.78] text-ink md:text-[11rem]">
                  <StatCounter value={barcelona.win} />
                </p>
                <p className="display mt-2 text-2xl md:text-4xl">Grand Prix win</p>
              </div>
            </div>
            <p className="display mt-14 text-[11vw] leading-[0.9] md:text-[5rem]">The story continues.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/data-lab?year=2026&gp=Spain&session=Race&driver=HAM&compare=LEC" className="btn btn-red">
                Analyse the race →
              </Link>
              <Link href="/races" className="btn btn-ghost">Every race →</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Hamilton remains an active Formula 1 driver with {eraSeasons('ferrari').length} Ferrari
            seasons contested to date. Nothing on this page is written as a conclusion.
          </p>
          <RightsNote className="mt-8" />
        </div>
      </section>
    </div>
  );
}
