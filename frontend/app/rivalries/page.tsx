import type { Metadata } from 'next';
import RivalCompare from '@/components/RivalCompare';
import { BarChart, SplitBar } from '@/components/charts';
import { Reveal, SectionHeader, SourceBadge } from '@/components/ui';
import { career, rivals, seasonFor } from '@/lib/data';

export const metadata: Metadata = {
  title: 'The Rivalries',
  description:
    'Lewis Hamilton compared with Nico Rosberg, Max Verstappen, Sebastian Vettel, Fernando Alonso, George Russell and Charles Leclerc — wins, poles, points and head-to-head records.',
};

export default function RivalriesPage() {
  const rosberg = rivals.find((r) => r.id === 'rosberg')!;
  const split = rosberg.seasonSplit ?? [];
  const s2021 = seasonFor(2021)!;

  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Head to head" title="The Rivalries"
          sub="Six drivers. Four of them teammates, which is the only comparison where the car is a controlled variable. The data is presented with its context; the conclusion is yours."
        />
      </header>

      <section className="mx-auto max-w-[1600px] px-5 pb-20 md:px-10">
        <RivalCompare rivals={rivals} careerHam={{
          championships: career.titles, wins: career.wins, poles: career.poles,
          podiums: career.podiums, points: career.points,
        }} />
      </section>

      {/* ROSBERG CASE STUDY */}
      <section id="rosberg" aria-labelledby="ros-title" className="border-t border-line bg-surface py-20">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <p className="eyebrow">Case study 01</p>
            <h2 id="ros-title" className="display mt-4 text-[13vw] leading-[0.84] md:text-[7rem]">
              Hamilton<br />vs Rosberg
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-tech">
              Four seasons, one garage, identical machinery. The rivalry that produced the closest
              thing Formula 1 has to a controlled experiment — and ended the moment it was won.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {split.map((s, i) => (
              <Reveal key={s.year} delay={0.06 * i}>
                <div className="panel h-full p-6">
                  <p className={`display text-5xl ${
                    s.ham.pts > s.riv.pts ? 'text-gold' : 'text-ferrari-bright'}`}>{s.year}</p>
                  <dl className="mt-6 space-y-4">
                    {[['Points', s.ham.pts, s.riv.pts], ['Wins', s.ham.wins, s.riv.wins],
                      ['Poles', s.ham.poles, s.riv.poles]].map(([k, a, b]) => (
                      <div key={k as string}>
                        <dt className="label mb-2">{k as string}</dt>
                        <dd>
                          <SplitBar left={a as number} right={b as number}
                            leftLabel="HAM" rightLabel="ROS" rightColor="#8A8A8A" />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-2">
              <div>
                <p className="display text-3xl md:text-5xl">2016 — the championship decider</p>
                <div className="prose-editorial mt-6">
                  <p>
                    Hamilton and Rosberg won ten and nine races respectively. Hamilton took twelve
                    poles to Rosberg&apos;s eight. The championship went to Rosberg by five points.
                  </p>
                  <p>
                    The margin is explained by reliability and by starts rather than by pace: an
                    engine failure while leading in Malaysia removed a probable twenty-five points,
                    and a run of poor getaways in the first half of the season cost more. Rosberg
                    finished second or better in the final four races and retired from the sport
                    five days after winning the title.
                  </p>
                </div>
                <SourceBadge className="mt-6" source="Formula1.com 2016 season classification" />
              </div>
              <div className="panel p-6">
                <p className="label mb-6">Four seasons, combined</p>
                <div className="space-y-6">
                  <div>
                    <p className="label mb-2">Qualifying head to head</p>
                    <SplitBar left={rosberg.h2hQualifying!.hamilton} right={rosberg.h2hQualifying!.rival}
                      leftLabel="Hamilton" rightLabel="Rosberg" rightColor="#8A8A8A" />
                  </div>
                  <div>
                    <p className="label mb-2">Race head to head</p>
                    <SplitBar left={rosberg.h2hRace!.hamilton} right={rosberg.h2hRace!.rival}
                      leftLabel="Hamilton" rightLabel="Rosberg" rightColor="#8A8A8A" />
                  </div>
                  <div>
                    <p className="label mb-3">Points by season</p>
                    <BarChart
                      data={split.map((s) => ({ label: String(s.year), value: s.ham.pts, compare: s.riv.pts }))}
                      ariaLabel="Hamilton and Rosberg points by season, 2013 to 2016"
                      color="#F4F4F4" compareColor="#8A8A8A" height={140}
                    />
                    <div className="mt-2 flex justify-between font-mono text-[9px] text-muted">
                      {split.map((s) => <span key={s.year}>{s.year}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VERSTAPPEN CASE STUDY */}
      <section id="verstappen" aria-labelledby="ver-title" className="border-t border-line py-20">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <p className="eyebrow">Case study 02</p>
            <h2 id="ver-title" className="display mt-4 text-[13vw] leading-[0.84] md:text-[7rem]">
              Hamilton<br />vs Verstappen
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-tech">
              Different cars, different teams, overlapping peaks. 2021 is the only season in which
              both drivers had machinery capable of winning the championship, and it went to the
              final lap of the final race.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-14 grid grid-cols-2 gap-8 border-y border-line py-10 md:grid-cols-5">
              {[
                ['Hamilton points', s2021.points], ['Verstappen points', s2021.rivalPoints],
                ['Hamilton wins', s2021.wins], ['Hamilton poles', s2021.poles],
                ['Hamilton podiums', s2021.podiums],
              ].map(([k, v], i) => (
                <div key={k as string}>
                  <dt className="label">{k as string}</dt>
                  <dd className={`display mt-3 text-4xl md:text-5xl ${i === 1 ? 'text-ferrari-bright' : ''}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {[
              ['The data', 'Twenty-two rounds, eight wins each in the first twenty-one, and a points gap of eight over the full season. On raw results the two campaigns are close to indistinguishable.'],
              ['The context', 'The final race finished under a safety car restart that the FIA subsequently found had not been run according to the regulations. The result stood, and the championship with it.'],
              ['The conclusion', 'This site does not offer one. Era, machinery, regulations and circumstance all differ, and the honest presentation is the numbers with their conditions attached.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={0.06 * i}>
                <h3 className="display text-2xl md:text-3xl">{t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-tech">{d}</p>
              </Reveal>
            ))}
          </div>
          <SourceBadge className="mt-10" source="Formula1.com 2021 season classification · FIA" />
        </div>
      </section>
    </div>
  );
}
