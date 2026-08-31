import Link from 'next/link';
import { Reveal, StatCounter } from './ui';
import ImagePlate from './ImagePlate';
import type { Season } from '@/lib/types';

const ERA_IMAGE = {
  mclaren: 'mclaren', mercedes: 'mercedes-alt', ferrari: 'ferrari-2026',
} as const;

const THEME = {
  mclaren: { accent: '#9BA1A6', bg: 'from-[#0B0B0B] to-noir', text: 'text-ink' },
  mercedes: { accent: '#B8B8B8', bg: 'from-[#0A0A0A] to-noir', text: 'text-ink' },
  ferrari: { accent: '#D40000', bg: 'from-[#140203] to-noir', text: 'text-ferrari-bright' },
} as const;

export default function EraSection({
  id, index, team, span, line, text, era, totals, seasons, highlights, href,
}: {
  id: 'mclaren' | 'mercedes' | 'ferrari';
  index: string; team: string; span: string; line: string; text: string;
  era: Season['era'];
  totals: { seasons: number; starts: number; wins: number; poles: number; podiums: number; titles: number };
  seasons: Season[];
  highlights: { label: string; value: string }[];
  href?: string;
}) {
  const t = THEME[id];
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`relative overflow-hidden border-t border-line bg-gradient-to-b ${t.bg} py-24 md:py-36`}
    >
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Reveal>
          <p className="eyebrow">Era {index}</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <h2 id={`${id}-title`} className={`display text-[16vw] leading-[0.82] md:text-[9rem] ${t.text}`}>
              {team}
            </h2>
            <span className="font-mono text-sm tracking-[0.2em] text-muted">{span}</span>
          </div>
          <p className="display mt-6 text-2xl md:text-4xl" style={{ color: t.accent }}>{line}</p>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <Reveal delay={0.1}>
              <p className="max-w-2xl text-base leading-[1.75] text-tech md:text-lg">{text}</p>
            </Reveal>

            <Reveal delay={0.15}>
              <dl className="mt-12 grid grid-cols-3 gap-6 border-y border-line py-8 md:grid-cols-6">
                {[
                  ['Seasons', totals.seasons], ['Titles', totals.titles], ['Wins', totals.wins],
                  ['Poles', totals.poles], ['Podiums', totals.podiums], ['Starts', totals.starts],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="label">{k}</dt>
                    <dd className={`display mt-2 text-4xl md:text-5xl ${
                      k === 'Titles' && (v as number) > 0 ? 'text-gold' : ''}`}>
                      <StatCounter value={v as number} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={0.2}>
              <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                {highlights.map((h) => (
                  <li key={h.label} className="border-l pl-4" style={{ borderColor: t.accent }}>
                    <p className="label">{h.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-tech">{h.value}</p>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="scroll-x mt-12 flex gap-px border-t border-line pt-6">
                {seasons.map((s) => (
                  <Link
                    key={s.year}
                    href={`/numbers?season=${s.year}`}
                    className="group min-w-[86px] shrink-0 border-b-2 px-2 py-3 transition-colors hover:bg-panel"
                    style={{ borderColor: s.champion ? '#C9A227' : '#222222' }}
                  >
                    <span className={`display block text-2xl ${s.champion ? 'text-gold' : 'text-tech'}`}>
                      {s.year}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-muted">
                      P{s.position} · {s.wins}W
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>

            {href && (
              <Reveal delay={0.3}>
                <Link href={href} className={`btn mt-10 ${id === 'ferrari' ? 'btn-red' : 'btn-ghost'}`}>
                  {id === 'ferrari' ? 'Enter the red chapter' : `Explore the ${team.toLowerCase()} years`} →
                </Link>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.2} className="lg:pt-4">
            <ImagePlate
              slot={ERA_IMAGE[id]}
              caption={`${team}, ${span}.`}
              accent={t.accent}
              aspect="3 / 4"
              sizes="(min-width: 1024px) 34vw, 100vw"
              tone={id === 'ferrari' ? 2 : id === 'mercedes' ? 1 : 0}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
