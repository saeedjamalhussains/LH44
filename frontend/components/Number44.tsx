'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Reveal } from './ui';

export default function Number44({
  origin, note, stages,
}: {
  origin: string; note: string;
  stages: { stage: string; year: string; text: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.06, 0.94]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <section
      id="number-44"
      aria-labelledby="n44-title"
      ref={ref}
      className="relative overflow-hidden border-t border-line py-24 md:py-36"
    >
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Reveal>
          <p className="eyebrow">Section 13</p>
          <h2 id="n44-title" className="display mt-4 text-[16vw] leading-[0.82] md:text-[9rem]">
            Why 44?
          </h2>
        </Reveal>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <motion.div style={{ scale, rotate }} className="relative flex justify-center">
            <p className="display select-none text-[46vw] leading-[0.75] text-ink lg:text-[26rem]" aria-hidden>
              44
            </p>
            <span className="absolute inset-0 -z-10 bg-[radial-gradient(closest-side,#C9A22722,transparent)]" />
          </motion.div>

          <div>
            <Reveal>
              <p className="display text-3xl leading-[0.95] md:text-5xl">
                The number<br />became the identity.
              </p>
              <p className="mt-6 max-w-xl leading-relaxed text-tech">{origin}</p>
            </Reveal>

            <ol className="mt-12 border-t border-line">
              {stages.map((s, i) => (
                <Reveal key={s.stage} delay={0.06 * i}>
                  <li className="grid grid-cols-[auto_1fr] gap-6 border-b border-line py-5 md:grid-cols-[7rem_9rem_1fr]">
                    <span className="display text-2xl text-gold md:text-3xl">{s.stage}</span>
                    <span className="font-mono text-[11px] tracking-[0.16em] text-muted md:pt-2">{s.year}</span>
                    <span className="col-span-2 text-sm leading-relaxed text-tech md:col-span-1">{s.text}</span>
                  </li>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={0.2}>
              <p className="mt-8 border-l-2 border-gold pl-5 font-mono text-xs uppercase leading-relaxed tracking-[0.16em] text-tech">
                {note}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
