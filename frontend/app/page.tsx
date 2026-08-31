import Link from 'next/link';
import Hero from '@/components/Hero';
import EraSection from '@/components/EraSection';
import CareerTimeline from '@/components/CareerTimeline';
import ChampionshipScroll from '@/components/ChampionshipScroll';
import Number44 from '@/components/Number44';
import ImagePlate from '@/components/ImagePlate';
import { Reveal, SectionHeader, StatCounter, SourceBadge, DataTimestamp } from '@/components/ui';
import {
  barcelona, beyondF1, career, championships, currentSeason, eraSeasons, eraTotals,
  featuredRaces, headlineStats, iconicLaps, meta, number44, rivals, seasons,
} from '@/lib/data';

export default function HomePage() {
  const iconic = featuredRaces.filter((r) =>
    ['2008-brazil', '2018-germany', '2020-turkey', '2021-brazil'].includes(r.id));

  return (
    <>
      <Hero stats={headlineStats} updatedAt={meta.updatedAt} />

      {/* 2 — THE NUMBERS ARE ONLY THE BEGINNING */}
      <section id="numbers-begin" aria-labelledby="intro-title"
        className="relative border-t border-line py-24 md:py-36">
        <div className="mx-auto grid max-w-[1600px] gap-14 px-5 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow">Section 02 · Introduction</p>
              <h2 id="intro-title" className="display mt-5 text-[13vw] leading-[0.84] md:text-[6.5rem] xl2:text-[7.5rem]">
                The numbers<br />are only the<br />beginning.
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="prose-editorial mt-10 max-w-xl">
                <p>
                  Seven world championships place Hamilton level with Michael Schumacher. {career.wins} Grand
                  Prix victories and {career.poles} pole positions place him ahead of everyone. Those are the
                  three sentences the record book supports, and they are the least interesting part of the story.
                </p>
                <p>
                  What the totals cannot show is the shape of the career underneath them: a rookie season
                  decided by a single point, five years extracting results from cars that were not the fastest,
                  a decade of dominance that reset what a competitive era looks like, and a move to Ferrari at
                  forty that no statistical model recommended.
                </p>
                <p>
                  This site holds both. The editorial explains the shape. The data lets you check it.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/numbers" className="btn btn-ghost">See every number →</Link>
                <Link href="/timeline" className="btn btn-ghost">Follow the career →</Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:pt-16">
            <ImagePlate slot="portrait" aspect="4 / 5"
              sizes="(min-width: 1024px) 38vw, 100vw" />
          </Reveal>
        </div>
      </section>

      {/* 3 — CAREER OVERVIEW */}
      <section id="journey" aria-labelledby="journey-title"
        className="border-t border-line bg-surface py-24 md:py-36">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <SectionHeader
            index="03" eyebrow="Career overview" title="The Journey"
            sub="From karting prodigy to seven-time world champion and Ferrari driver. Every season, every result, expandable."
          />
          <CareerTimeline seasons={seasons} />
          <Reveal>
            <div className="mt-12">
              <DataTimestamp updatedAt={meta.updatedAt} label="Season table updated" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 & 5 — ERAS */}
      <EraSection
        id="mclaren" index="01" team="McLaren" span="2007–2012" era="mclaren"
        line="THE ARRIVAL"
        text="A rookie season that ended one point short of the title, a championship the following year decided at the last corner of the last lap, and five seasons of extracting more from the machinery than it was rated to give. The McLaren years established the ceiling. They did not establish the record."
        totals={eraTotals('mclaren')} seasons={eraSeasons('mclaren')}
        highlights={[
          { label: 'Debut', value: 'Melbourne, 2007. Third place on the first attempt, ahead of a reigning double world champion in the same car.' },
          { label: 'First win', value: 'Montreal, 2007. Sixth Grand Prix start, first pole, led every lap that mattered.' },
          { label: 'First title', value: 'Interlagos, 2008. Fifth place, taken at the final corner, by one point.' },
          { label: 'The wet races', value: 'Silverstone 2008, won by 68 seconds. The template for everything that followed in changing conditions.' },
        ]}
      />

      <EraSection
        id="mercedes" index="02" team="Mercedes" span="2013–2024" era="mercedes"
        line="PRECISION BECAME DOMINANCE"
        text="Twelve seasons, six world championships, and the most sustained period of success any driver has had with a single team. It began with a move almost nobody in the paddock endorsed, and it ended with two wins in a car that had no business producing them."
        totals={eraTotals('mercedes')} seasons={eraSeasons('mercedes')}
        highlights={[
          { label: 'The dominance', value: 'Five titles in six seasons between 2014 and 2020, including three won with races to spare.' },
          { label: 'The rivalries', value: 'Rosberg across four seasons in the same car. Vettel across two. Verstappen across one, and it went to the last lap.' },
          { label: 'The records', value: 'The all-time pole record passed in 2017; the win record in 2020; a seventh title in the same year.' },
          { label: 'The decline', value: 'Three seasons of a car off the pace, and nine podiums extracted from the worst of them.' },
        ]}
        href="/championships"
      />

      {/* 6 — SEVEN CHAMPIONSHIPS */}
      <section id="championships" aria-labelledby="champ-title" className="border-t border-line py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <SectionHeader
            index="06" eyebrow="World championships" title="Seven Times." accent="text-gold"
            sub="Scroll through each title. Points, wins, poles, margin — and the afternoon that decided it."
          />
        </div>
        <ChampionshipScroll championships={championships} />
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <Link href="/championships" className="btn btn-gold mt-10">All seven championships →</Link>
          </Reveal>
        </div>
      </section>

      {/* 7 — ICONIC MOMENTS */}
      <section id="moments" aria-labelledby="moments-title"
        className="border-t border-line bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <SectionHeader
            index="07" eyebrow="Iconic moments" title="The Races That Mattered"
            sub="Four afternoons that explain more about the career than any career total does."
          />
          <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
            {iconic.map((r, i) => (
              <li key={r.id} className="bg-noir">
                <Reveal delay={0.06 * i}>
                  <article className="group h-full p-7 transition-colors hover:bg-panel md:p-10">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="display text-6xl text-ink md:text-7xl">{r.year}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                        {r.team}
                      </span>
                    </div>
                    <h3 className="display mt-4 text-2xl md:text-3xl">{r.gp}</h3>
                    <dl className="mt-6 flex gap-8 border-y border-line py-4 font-mono text-xs">
                      <div><dt className="label">Grid</dt><dd className="mt-1 text-xl text-ink tabular">P{r.grid}</dd></div>
                      <div><dt className="label">Finish</dt><dd className="mt-1 text-xl text-gold tabular">P{r.finish}</dd></div>
                      <div><dt className="label">Points</dt><dd className="mt-1 text-xl text-ink tabular">{r.points}</dd></div>
                    </dl>
                    <p className="mt-5 text-sm leading-relaxed text-tech">{r.story}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <Link href="/iconic-laps" className="btn btn-ghost mt-10">The laps that mattered →</Link>
          </Reveal>
        </div>
      </section>

      {/* 8 — DATA LAB PREVIEW */}
      <section id="data-lab-preview" aria-labelledby="lab-title"
        className="techgrid relative border-t border-line py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <SectionHeader
                index="08" eyebrow="Interactive telemetry" title="The Data Lab"
                sub="Where the legacy becomes measurable. Speed, throttle, brake, gear, RPM and lap delta — read straight from session timing data via FastF1."
              />
              <ul className="space-y-px border border-line bg-line">
                {[
                  ['Speed trace', 'km/h against track distance, for any lap of any session.'],
                  ['Driver delta', 'Cumulative time gained or lost, metre by metre, against a chosen rival.'],
                  ['Sector split', 'Three sectors, three comparisons, one lap time.'],
                  ['Circuit playback', 'The 44 marker moving around the lap, synchronised to every channel.'],
                ].map(([t, d], i) => (
                  <li key={t} className="bg-noir p-5">
                    <div className="flex gap-5">
                      <span className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{t}</p>
                        <p className="mt-1 text-sm text-muted">{d}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/data-lab" className="btn btn-primary mt-10">Enter the data lab →</Link>
            </div>

            <Reveal delay={0.1} className="lg:pt-24">
              <div className="panel p-6">
                <div className="flex items-baseline justify-between">
                  <p className="label">Speed trace · preview</p>
                  <p className="font-mono text-xs text-muted">km/h</p>
                </div>
                <svg viewBox="0 0 600 200" className="mt-4 w-full" role="img"
                  aria-label="Illustrative speed trace showing braking and acceleration through a lap">
                  <g stroke="#222" strokeWidth="0.75">
                    {[0, 50, 100, 150, 200].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} />)}
                    {[0, 120, 240, 360, 480, 600].map((x) => <line key={x} y1="0" y2="200" x1={x} x2={x} opacity="0.5" />)}
                  </g>
                  <path
                    d="M0 40 L60 30 L90 150 L130 120 L170 60 L210 45 L240 170 L280 130 L320 55 L360 35 L400 160 L440 110 L480 50 L530 30 L560 90 L600 60"
                    fill="none" stroke="#F4F4F4" strokeWidth="1.5" />
                  <path
                    d="M0 55 L60 45 L90 158 L130 132 L170 75 L210 60 L240 176 L280 142 L320 70 L360 52 L400 166 L440 122 L480 66 L530 46 L560 100 L600 74"
                    fill="none" stroke="#D40000" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.85" />
                </svg>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.16em]">
                  <span className="text-ink">— HAM</span>
                  <span className="text-ferrari-bright">--- Rival</span>
                  <span className="text-muted">Illustrative preview</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9 — RIVALRIES */}
      <section id="rivalries" aria-labelledby="riv-title"
        className="border-t border-line bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <SectionHeader
            index="09" eyebrow="Head to head" title="The Rivalries"
            sub="Six drivers, four of them teammates. The comparison is presented with its context; the conclusion is left to you."
          />
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {rivals.map((r, i) => (
              <li key={r.id} className="bg-noir">
                <Reveal delay={0.05 * i}>
                  <Link href={`/rivalries#${r.id}`} className="group block h-full p-7 transition-colors hover:bg-panel">
                    <p className="label">{r.teammate ? 'Teammate' : 'Championship rival'} · {r.years}</p>
                    <p className="display mt-3 text-3xl md:text-4xl">{r.name}</p>
                    <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4 font-mono text-xs">
                      {[['Titles', r.championships], ['Wins', r.wins], ['Poles', r.poles]].map(([k, v]) => (
                        <div key={k as string}>
                          <dt className="label">{k}</dt>
                          <dd className="mt-1 text-lg text-tech tabular">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-sm leading-relaxed text-muted">{r.note}</p>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <Link href="/rivalries" className="btn btn-ghost mt-10">Compare the data →</Link>
          </Reveal>
        </div>
      </section>

      {/* 10 — FERRARI CHAPTER */}
      <EraSection
        id="ferrari" index="03" team="Ferrari" span="2025–Present" era="ferrari"
        line="A DIFFERENT ERA. A DIFFERENT CHALLENGE."
        text="A first season in red that produced a sprint win in Shanghai and no Grand Prix podium across the rest of the year. Then a regulation change, and a car that arrived. The chapter is open, and the numbers on this page move with it."
        totals={eraTotals('ferrari')} seasons={eraSeasons('ferrari')}
        highlights={[
          { label: '2025', value: 'The first Ferrari season. A sprint pole and sprint win in the third weekend, and a year spent adapting to a car built around someone else.' },
          { label: '2026', value: `New regulations, and P${currentSeason.position} in the championship after ${currentSeason.starts} rounds with ${currentSeason.points} points.` },
          { label: 'Barcelona', value: 'The 106th Grand Prix victory, and the first in red, from second on the grid.' },
          { label: 'The number', value: '44 in Ferrari red. The one element of the livery that did not change.' },
        ]}
        href="/ferrari"
      />

      {/* 11 — BARCELONA 2026 */}
      <section id="barcelona" aria-labelledby="barca-title"
        className="relative border-t border-line bg-gradient-to-b from-[#160203] to-noir py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <p className="eyebrow">Section 11 · Feature</p>
            <h2 id="barca-title" className="display mt-4 text-[20vw] leading-[0.8] text-ferrari-bright md:text-[11rem]">
              The 106th.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-tech">
              Hamilton&apos;s first Ferrari Grand Prix victory. Barcelona-Catalunya, {barcelona.year},
              from P{barcelona.grid} on the grid across {barcelona.laps} laps.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-14 grid grid-cols-2 gap-8 border-y border-line py-10 md:grid-cols-4">
              {[
                ['Finish', `P${barcelona.finish}`], ['Points', String(barcelona.points)],
                ['Winning margin', barcelona.gap], ['Laps', String(barcelona.laps)],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="label">{k}</dt>
                  <dd className={`display mt-3 text-ink ${
                    v.length > 5 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-6xl'}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-12 flex flex-wrap items-end gap-10">
              <div>
                <p className="label">Career victory</p>
                <p className="display text-[22vw] leading-[0.8] text-ferrari md:text-[12rem]">
                  <StatCounter value={barcelona.win} />
                </p>
              </div>
              <div className="pb-6">
                <p className="display text-2xl md:text-4xl">Grand Prix win</p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                  The number keeps moving. The significance does not.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ferrari#barcelona" className="btn btn-red">The full race →</Link>
              <Link href="/races" className="btn btn-ghost">Explore every race →</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 12 — BEYOND F1 */}
      <section id="beyond" aria-labelledby="beyond-title" className="border-t border-line py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <SectionHeader
            index="12" eyebrow="Beyond the lap" title="The Legacy Beyond F1"
            sub="Stated fact and editorial interpretation, kept separate and labelled throughout."
          />
          <ul className="grid gap-px border border-line bg-line md:grid-cols-3">
            {beyondF1.sections.slice(0, 3).map((s, i) => (
              <li key={s.id} className="bg-noir p-7">
                <Reveal delay={0.06 * i}>
                  <p className="display text-2xl md:text-3xl">{s.title}</p>
                  <p className="label mt-5">Fact</p>
                  <p className="mt-2 text-sm leading-relaxed text-tech">{s.fact}</p>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <Link href="/beyond-f1" className="btn btn-ghost mt-10">Read the full chapter →</Link>
          </Reveal>
        </div>
      </section>

      {/* 13 — THE NUMBER 44 */}
      <Number44 origin={number44.origin} note={number44.note} stages={number44.stages} />

      {/* 14 — FINAL LEGACY STATEMENT */}
      <section aria-labelledby="legacy-title"
        className="filmgrain relative border-t border-line bg-surface py-28 md:py-40">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 id="legacy-title" className="sr-only">The legacy</h2>
            <ol className="space-y-1">
              {[
                [String(career.titles), 'World titles'],
                [String(career.wins), 'Grand Prix wins'],
                [String(career.poles), 'Pole positions'],
                [String(career.podiums), 'Podiums'],
                ['44', 'The number'],
              ].map(([v, l], i) => (
                <li key={l} className="flex flex-wrap items-baseline gap-x-8 border-b border-line py-4">
                  <span className={`display text-[16vw] leading-[0.85] md:text-[8rem] ${
                    i === 4 ? 'text-gold' : 'text-ink'}`}>{v}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest2 text-muted">{l}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="display mt-20 text-[13vw] leading-[0.86] md:text-[7rem]">
              The story<br />is still<br />being written.
            </p>
            <p className="mt-8 max-w-xl leading-relaxed text-tech">
              Hamilton is an active Formula 1 driver. Every figure on this site is read from a data
              layer that updates as the season runs — nothing here is written as though the career
              has finished, because it has not.
            </p>
            <SourceBadge className="mt-6" source={meta.sources.career.label} updatedAt={meta.updatedAt} />
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/data-lab" className="btn btn-primary">Explore the data</Link>
              <Link href="#main" className="btn btn-ghost">Return to the legacy</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
