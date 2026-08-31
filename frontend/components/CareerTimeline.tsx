'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import type { Season } from '@/lib/types';
import { ordinal } from '@/lib/format';

const ERA_ACCENT: Record<Season['era'], string> = {
  mclaren: '#9BA1A6', mercedes: '#B8B8B8', ferrari: '#D40000',
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="display mt-1 text-3xl md:text-4xl">{value}</p>
    </div>
  );
}

/**
 * Vertical career timeline. Each year expands in place to a full-width panel.
 * Keyboard operable: the row header is a real button with aria-expanded.
 */
export default function CareerTimeline({
  seasons, initialOpen,
}: { seasons: Season[]; initialOpen?: number }) {
  const [open, setOpen] = useState<number | null>(initialOpen ?? null);

  return (
    <ol className="relative border-l border-line pl-5 md:pl-10">
      <li className="relative pb-10">
        <span className="absolute -left-[calc(1.25rem+4px)] top-2 h-2 w-2 rounded-full bg-line md:-left-[calc(2.5rem+4px)]" />
        <p className="label">Before Formula 1</p>
        <p className="display mt-2 text-4xl text-muted md:text-6xl">EARLY YEARS</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-tech">
          Karting from six years old, the McLaren young driver programme from thirteen, and a
          championship in each of Formula Renault, Formula 3 Euro Series and GP2 on the way up.
        </p>
      </li>

      {seasons.map((s) => {
        const isOpen = open === s.year;
        const accent = ERA_ACCENT[s.era];
        return (
          <li key={s.year} className="relative border-t border-line">
            <span
              className="absolute -left-[calc(1.25rem+5px)] top-8 h-2.5 w-2.5 rounded-full md:-left-[calc(2.5rem+5px)]"
              style={{ background: s.champion ? '#C9A227' : accent }}
              aria-hidden
            />
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.year)}
                aria-expanded={isOpen}
                aria-controls={`season-${s.year}`}
                className="group flex w-full flex-col gap-2 py-6 text-left transition-colors
                  hover:bg-panel/40 md:flex-row md:items-baseline md:gap-8"
              >
                <span className={`display w-28 shrink-0 text-5xl md:text-6xl ${
                  s.champion ? 'text-gold' : 'text-ink'}`}>
                  {s.year}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.18em]"
                    style={{ color: accent }}>
                    {s.team}{s.inProgress ? ' · Season in progress' : ''}
                  </span>
                  <span className="mt-1 block text-sm text-tech md:text-base">
                    {s.champion ? 'World Champion' : `${ordinal(s.position)} in the championship`}
                    <span className="text-muted"> · {s.wins} wins · {s.poles} poles · {s.podiums} podiums · {s.points} pts</span>
                  </span>
                </span>
                <span aria-hidden className="font-mono text-lg text-muted transition-transform
                  group-hover:text-ink" style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`season-${s.year}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="panel mb-8 p-5 md:p-8" style={{ borderColor: `${accent}44` }}>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
                      <Metric label="Championship" value={s.champion ? 'P1' : `P${s.position}`} />
                      <Metric label="Points" value={s.points} />
                      <Metric label="Starts" value={s.starts} />
                      <Metric label="Wins" value={s.wins} />
                      <Metric label="Poles" value={s.poles} />
                      <Metric label="Podiums" value={s.podiums} />
                    </div>
                    <div className="mt-8 grid gap-8 border-t border-line pt-6 md:grid-cols-[1.4fr_1fr]">
                      <div>
                        <p className="label">Key moment</p>
                        <p className="mt-2 max-w-2xl leading-relaxed text-tech">{s.keyMoment}</p>
                      </div>
                      <dl className="grid grid-cols-2 gap-4 font-mono text-xs">
                        {[
                          ['Car', s.car], ['Engine', s.engine], ['Teammate', s.teammate],
                          ['Fastest laps', String(s.fastestLaps)], ['Retirements', String(s.dnfs)],
                          ['Avg grid', s.avgGrid.toFixed(1)], ['Avg finish', s.avgFinish.toFixed(1)],
                          ...(s.rival ? [['Title rival', `${s.rival} (${s.rivalPoints} pts)`]] : []),
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt className="label">{k}</dt>
                            <dd className="mt-1 text-tech">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
                      <Link href={`/numbers?season=${s.year}`} className="btn btn-ghost">
                        Analyse {s.year}
                      </Link>
                      {s.champion && (
                        <Link href={`/championships/${s.year}`} className="btn btn-gold">
                          The {s.year} championship
                        </Link>
                      )}
                      <Link href={`/races?year=${s.year}`} className="btn btn-ghost">
                        Races
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}

      <li className="relative border-t border-line pt-8">
        <span className="absolute -left-[calc(1.25rem+4px)] top-10 h-2 w-2 animate-pulse rounded-full bg-ferrari md:-left-[calc(2.5rem+4px)]" />
        <p className="display text-4xl text-ferrari-bright md:text-6xl">STILL RUNNING</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-tech">
          Hamilton remains an active Formula 1 driver. This timeline extends automatically as
          each season is added to the data layer.
        </p>
      </li>
    </ol>
  );
}
