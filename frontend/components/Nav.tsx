'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PRIMARY = [
  { href: '/', label: 'LEGACY' },
  { href: '/numbers', label: 'NUMBERS' },
  { href: '/championships', label: 'CHAMPIONSHIPS' },
  { href: '/timeline', label: 'TIMELINE' },
  { href: '/machines', label: 'MACHINES' },
  { href: '/data-lab', label: 'DATA LAB' },
  { href: '/rivalries', label: 'RIVALRIES' },
  { href: '/races', label: 'RACES' },
  { href: '/circuits', label: 'CIRCUITS' },
  { href: '/ferrari', label: 'FERRARI' },
];

const MOBILE = [
  { href: '/', label: 'THE LEGACY' },
  { href: '/timeline', label: 'CAREER' },
  { href: '/championships', label: 'CHAMPIONSHIPS' },
  { href: '/numbers', label: 'THE NUMBERS' },
  { href: '/data-lab', label: 'DATA LAB' },
  { href: '/iconic-laps', label: 'ICONIC LAPS' },
  { href: '/rivalries', label: 'RIVALRIES' },
  { href: '/races', label: 'RACE ARCHIVE' },
  { href: '/circuits', label: 'CIRCUITS' },
  { href: '/machines', label: 'MACHINES' },
  { href: '/ferrari', label: 'FERRARI' },
  { href: '/beyond-f1', label: 'BEYOND F1' },
  { href: '/sources', label: 'SOURCES' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  const isFerrari = pathname?.startsWith('/ferrari');

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4
        focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-noir">
        Skip to content
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? 'border-line bg-noir/92 backdrop-blur-xl'
            : 'border-transparent bg-gradient-to-b from-noir/80 to-transparent'
        }`}
      >
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="group flex items-baseline gap-3" aria-label="Lewis Hamilton, the legacy of 44 — home">
            <span className={`display text-3xl leading-none transition-colors ${
              isFerrari ? 'text-ferrari-bright' : 'text-ink'}`}>44</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest2 text-muted sm:block">
              Hamilton
            </span>
          </Link>

          <ul className="hidden items-center gap-7 lg:flex">
            {PRIMARY.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                      active ? 'text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex items-center gap-3 lg:hidden"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {open ? 'CLOSE' : 'MENU'}
            </span>
            <span className="relative block h-3 w-6" aria-hidden>
              <span className={`absolute left-0 block h-px w-6 bg-ink transition-transform duration-300 ${
                open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 block h-px w-6 bg-ink transition-transform duration-300 ${
                open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col bg-noir pt-16 lg:hidden"
          >
            <ul className="scroll-x flex-1 overflow-y-auto px-5 py-8">
              {MOBILE.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.35 }}
                  className="border-b border-line"
                >
                  <Link href={item.href} className="flex items-baseline justify-between py-4">
                    <span className="display text-3xl text-ink">{item.label}</span>
                    <span className="font-mono text-[10px] text-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
