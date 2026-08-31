'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { StatBlock, DataTimestamp } from './ui';
import { imageFor } from '@/lib/images';
import type { Stat } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Slow-drifting telemetry traces behind the title. Decorative only. */
function TelemetryBackdrop() {
  const reduced = useReducedMotion();
  const lines = [
    { d: 'M0 320 C 200 260, 320 420, 520 330 S 820 200, 1200 300', o: 0.5 },
    { d: 'M0 420 C 260 480, 420 300, 640 400 S 900 520, 1200 420', o: 0.3 },
    { d: 'M0 220 C 180 160, 400 260, 600 190 S 960 120, 1200 210', o: 0.22 },
  ];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="tl" x1="0" x2="1">
          <stop offset="0%" stopColor="#F4F4F4" stopOpacity="0" />
          <stop offset="45%" stopColor="#F4F4F4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F4F4F4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map((l, i) => (
        <motion.path
          key={i} d={l.d} fill="none" stroke="url(#tl)" strokeWidth="1" opacity={l.o}
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.6, delay: 0.6 + i * 0.35, ease: EASE }}
        />
      ))}
      {!reduced && (
        <motion.line
          x1="0" x2="1200" y1="0" y2="0" stroke="#C9A227" strokeWidth="0.75" opacity="0.35"
          animate={{ y1: [120, 520, 120], y2: [180, 460, 180] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </svg>
  );
}

export default function Hero({ stats, updatedAt }: { stats: Stat[]; updatedAt: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const hero = imageFor('hero');
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="filmgrain relative isolate min-h-[100svh] overflow-hidden techgrid">
      <motion.div style={reduced ? undefined : { y, opacity }} className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_25%_35%,#141414_0%,#050505_70%)]" />
        {/* Hamilton, held at 70% behind the scrims.

            No freely licensed video of Hamilton exists — every clip of him is
            Formula 1 or broadcaster copyright — so rather than substitute
            footage of somebody else, the still is given a slow continuous drift
            that reads as motion. Drop a licensed clip in and this becomes a
            <video> with the same composition. */}
        {hero && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={hero.src}
              alt=""
              fill
              priority
              sizes="100vw"
              aria-hidden
              className={`object-cover object-[70%_center] opacity-[0.70] ${
                reduced ? '' : 'hero-drift'}`}
            />
          </div>
        )}
        <TelemetryBackdrop />
        {/* Heavy scrim: the type must stay legible over any photograph. */}
        <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/85 to-noir/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-noir/75" />
      </motion.div>

      <div className="mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-center px-5 pb-24 pt-24 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: EASE }}
          className="display text-[34vw] leading-[0.78] text-ink md:text-[14rem] xl2:text-[17rem]"
        >
          44
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.5, ease: EASE }}
          className="display mt-1 text-[12vw] leading-[0.85] md:text-[5rem] xl2:text-[6rem]"
        >
          Lewis Hamilton
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
          className="display mt-2 text-[6.5vw] text-gold md:text-3xl xl2:text-4xl"
        >
          The Legacy of 44
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.2 }}
          className="mt-6 max-w-xl"
        >
          <p className="text-sm leading-relaxed text-tech md:text-base">
            Seven world championships. More than one hundred Grand Prix victories.
            One of the defining careers in Formula 1.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-muted">
            A career measured in milliseconds.<br />A legacy measured in generations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-7 flex flex-wrap gap-3"
        >
          <Link href="#numbers-begin" className="btn btn-primary">Explore the legacy</Link>
          <Link href="/data-lab" className="btn btn-ghost">Enter the data lab</Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.7 }}
          className="mt-10 border-t border-line pt-6"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.75 + i * 0.12 }}>
                <StatBlock stat={s} size="sm" accent={i === 0 ? 'text-gold' : 'text-ink'} />
              </motion.div>
            ))}
          </div>
          <div className="mt-6"><DataTimestamp updatedAt={updatedAt} /></div>
        </motion.div>
      </div>

      {hero && (
        <p className="absolute bottom-6 right-5 hidden font-mono text-[9px] uppercase tracking-[0.14em] text-muted md:block">
          Photo: {hero.artist} · {hero.licence} · Wikimedia Commons
        </p>
      )}

      <motion.a
        href="#numbers-begin"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
        className="absolute inset-x-0 bottom-6 mx-auto flex w-fit items-center gap-3
          font-mono text-[10px] uppercase tracking-widest2 text-muted hover:text-ink"
      >
        Scroll to explore
        <motion.span aria-hidden animate={reduced ? {} : { y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>↓</motion.span>
      </motion.a>
    </section>
  );
}
