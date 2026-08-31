'use client';

import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useRef, useState } from 'react';
import type { Championship } from '@/lib/types';

/**
 * The pinned championship sequence.
 *
 * A tall scroll container holds a sticky viewport; scroll progress drives which
 * of the seven years is foregrounded. On small screens and under reduced motion
 * the same content reads as a plain stacked list, which is what mobile wants.
 */
export default function ChampionshipScroll({ championships }: { championships: Championship[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(championships.length - 1, Math.max(0, Math.floor(p * championships.length)));
    setIndex((cur) => (cur === next ? cur : next));
  });

  const active = championships[index];

  return (
    <>
      {/* Pinned sequence — desktop */}
      <div ref={ref} className="relative hidden lg:block" style={{ height: `${championships.length * 90}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[0.9fr_1.1fr] gap-16 px-10">
            <div className="relative">
              <p className="label mb-6">
                Championship {String(index + 1).padStart(2, '0')} / {championships.length}
              </p>
              <div className="relative h-[34vh]">
                {championships.map((c, i) => (
                  <motion.p
                    key={c.year}
                    aria-hidden={i !== index}
                    animate={{
                      opacity: i === index ? 1 : 0,
                      y: i === index ? 0 : i < index ? -60 : 60,
                    }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="display absolute inset-0 text-[13rem] leading-[0.8] text-gold xl2:text-[16rem]"
                  >
                    {c.year}
                  </motion.p>
                ))}
              </div>
              <ol className="mt-10 flex gap-2" aria-label="Championship years">
                {championships.map((c, i) => (
                  <li key={c.year}>
                    <span
                      className={`block h-[2px] w-14 transition-colors duration-500 ${
                        i <= index ? 'bg-gold' : 'bg-line'}`}
                    />
                    <span className="mt-2 block font-mono text-[10px] text-muted tabular">{c.year}</span>
                  </li>
                ))}
              </ol>
            </div>

            <motion.div
              key={active.year}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="panel p-10"
            >
              <p className="display text-5xl text-ink">{active.line}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {active.team} · Clinched at the {active.clinched}
              </p>
              <dl className="mt-10 grid grid-cols-3 gap-8 border-y border-line py-8">
                {[
                  ['Points', active.points], ['Wins', active.wins], ['Poles', active.poles],
                  ['Podiums', active.podiums], ['Fastest laps', active.fastestLaps],
                  ['Margin', `+${active.margin}`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="label">{k}</dt>
                    <dd className="display mt-2 text-4xl">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="label mt-8">Defining moment</p>
              <p className="mt-3 leading-relaxed text-tech">{active.definingMoment}</p>
              <Link href={`/championships/${active.year}`} className="btn btn-gold mt-8">
                The {active.year} season →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stacked list — tablet and mobile */}
      <ol className="space-y-4 lg:hidden">
        {championships.map((c) => (
          <li key={c.year}>
            <Link href={`/championships/${c.year}`} className="panel block p-6 transition-colors hover:border-gold/50">
              <div className="flex items-baseline justify-between">
                <span className="display text-6xl text-gold">{c.year}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{c.team}</span>
              </div>
              <p className="display mt-3 text-2xl">{c.line}</p>
              <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-line pt-4 font-mono text-xs">
                {[['PTS', c.points], ['WIN', c.wins], ['POL', c.poles], ['POD', c.podiums]].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="label">{k}</dt>
                    <dd className="mt-1 text-lg text-ink tabular">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-muted">{c.definingMoment}</p>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
