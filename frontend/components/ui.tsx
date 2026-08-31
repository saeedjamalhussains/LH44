'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Stat } from '@/lib/types';

/**
 * Fade-and-rise on entry.
 *
 * Implemented with CSS rather than a JS animation, because the entrance must
 * never be able to gate content. The element renders visible; JS arms the
 * hidden state only after mount, and both the viewport observer and a failsafe
 * timer clear it. Clearing a class is instant and needs no animation frame, so
 * a paused requestAnimationFrame, an observer that never fires or an
 * interrupted animation cannot leave text or images permanently invisible.
 */
export function Reveal({
  children, delay = 0, y = 24, className = '', once = true,
}: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    el.classList.add('reveal-armed');
    let done = false;
    const play = () => {
      if (done) return;
      done = true;
      el.classList.remove('reveal-armed');
      el.classList.add('reveal-in');
    };
    // Failsafe: reveal regardless, whatever the observer or the frame loop does.
    const timer = setTimeout(play, 1800 + delay * 1000);

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          play();
          if (once) io.disconnect();
        }
      }
    }, { rootMargin: '-80px' });
    io.observe(el);

    return () => { clearTimeout(timer); io.disconnect(); };
  }, [delay, once, reduced]);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Counts a number up when it scrolls into view. Respects reduced motion. */
export function StatCounter({
  value, duration = 1.4, decimals = 0, className = '',
}: { value: number; duration?: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) { setDisplay(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // easeOutExpo — fast, then settles. Reads as a readout stabilising.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {display.toLocaleString('en-GB', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      })}
    </span>
  );
}

export function SourceBadge({
  source, updatedAt, calculated, className = '',
}: { source: string; updatedAt?: string; calculated?: boolean; className?: string }) {
  return (
    <p className={`font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-muted ${className}`}>
      {calculated && <span className="mr-2 border border-silver-dim px-1 py-0.5 text-silver">CALC</span>}
      <span>Source: {source}</span>
      {updatedAt && <span className="ml-2 text-silver-dim">· {updatedAt}</span>}
    </p>
  );
}

export function StatBlock({
  stat, size = 'md', accent = 'text-ink',
}: { stat: Stat; size?: 'sm' | 'md' | 'lg'; accent?: string }) {
  const numeric = typeof stat.value === 'number';
  const decimals = numeric && !Number.isInteger(stat.value) ? (String(stat.value).split('.')[1]?.length ?? 1) : 0;
  const sizes = {
    sm: 'text-4xl md:text-[2.75rem]',
    md: 'text-6xl md:text-7xl',
    lg: 'text-7xl md:text-[8rem]',
  }[size];

  return (
    <div className="group">
      <p className="label mb-2">{stat.label}</p>
      <p className={`display ${sizes} ${accent}`}>
        {numeric
          ? <StatCounter value={stat.value as number} decimals={decimals} />
          : stat.value}
      </p>
      <SourceBadge className="mt-2" source={stat.source} updatedAt={stat.updatedAt}
        calculated={stat.calculated} />
    </div>
  );
}

export function SectionHeader({
  index, eyebrow, title, sub, accent = 'text-ink', as = 'h2',
}: {
  index?: string; eyebrow?: string; title: string; sub?: string; accent?: string;
  /** Page-level headers pass "h1"; in-page section headers keep the default. */
  as?: 'h1' | 'h2';
}) {
  const Heading = as;
  return (
    <Reveal className="mb-12 md:mb-16">
      <div className="flex items-baseline gap-4">
        {index && <span className="font-mono text-[10px] tracking-[0.2em] text-muted">{index}</span>}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      </div>
      <Heading className={`display mt-4 text-[13vw] leading-[0.85] md:text-[6rem] xl2:text-[7rem] ${accent}`}>
        {title}
      </Heading>
      {sub && <p className="mt-5 max-w-2xl text-tech md:text-lg">{sub}</p>}
    </Reveal>
  );
}

export function DataTimestamp({ updatedAt, label = 'Data updated' }: { updatedAt: string; label?: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
      <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-gold" aria-hidden />
      {label}: <span className="text-tech">{updatedAt}</span>
    </p>
  );
}

export function LoadingState({ label = 'LOADING DATA' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-6 py-24">
      <motion.p
        className="display text-7xl text-ink"
        animate={{ opacity: [0.25, 1, 0.25] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        44
      </motion.p>
      <p className="label">{label}</p>
      <svg viewBox="0 0 240 24" className="h-6 w-60 text-line" aria-hidden>
        <motion.path
          d="M0 12 L40 12 L52 4 L64 20 L76 8 L88 12 L120 12 L132 6 L144 18 L156 12 L240 12"
          fill="none" stroke="currentColor" strokeWidth="1"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}

export function ErrorState({
  title = 'DATA UNAVAILABLE', message, action,
}: { title?: string; message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="panel flex flex-col items-start gap-4 p-8 md:p-12">
      <p className="display text-3xl text-silver md:text-4xl">{title}</p>
      <p className="max-w-xl text-sm leading-relaxed text-muted">{message}</p>
      {action}
    </div>
  );
}
