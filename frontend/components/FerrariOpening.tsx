'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * The opening transition: black → white → Ferrari red, driven by scroll.
 * Under reduced motion it settles straight to the red state.
 */
export default function FerrariOpening() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const background = useTransform(scrollYProgress, [0, 0.42, 0.75], ['#050505', '#F4F4F4', '#D40000']);
  const color = useTransform(scrollYProgress, [0, 0.42, 0.75], ['#F4F4F4', '#050505', '#F4F4F4']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);

  if (reduced) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-ferrari">
        <div className="text-center">
          <p className="display text-[38vw] leading-none text-ink md:text-[18rem]">44</p>
          <p className="display mt-4 text-4xl text-ink md:text-6xl">The Red Chapter</p>
        </div>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative h-[220vh]">
      <motion.section
        style={{ background }}
        className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden"
        aria-label="Ferrari chapter opening"
      >
        <motion.p style={{ color, scale }} className="display text-[42vw] leading-none md:text-[22rem]">
          44
        </motion.p>
        <motion.p style={{ color }} className="display mt-4 text-3xl md:text-6xl">
          The Red Chapter
        </motion.p>
        <motion.p style={{ color, opacity: useTransform(scrollYProgress, [0.5, 0.8], [0, 1]) }}
          className="mt-4 font-mono text-[11px] uppercase tracking-widest2">
          A new chapter in the story of 44
        </motion.p>
      </motion.section>
    </div>
  );
}
