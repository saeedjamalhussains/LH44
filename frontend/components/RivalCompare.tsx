'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, SplitBar } from './charts';
import { SourceBadge } from './ui';
import type { Rival } from '@/lib/types';

const HAM = { championships: 7, wins: 106, poles: 104, podiums: 207, points: 5201.5 };

const METRICS: { key: keyof typeof HAM; label: string }[] = [
  { key: 'championships', label: 'Championships' },
  { key: 'wins', label: 'Wins' },
  { key: 'poles', label: 'Poles' },
  { key: 'podiums', label: 'Podiums' },
  { key: 'points', label: 'Career points' },
];

/**
 * Hamilton against a selected rival.
 *
 * Career totals are presented side by side without a verdict: teammates share a
 * car and non-teammates do not, and the page says which is which rather than
 * ranking them.
 */
export default function RivalCompare({ rivals, careerHam }: { rivals: Rival[]; careerHam: typeof HAM }) {
  const [id, setId] = useState(rivals[0].id);
  const rival = rivals.find((r) => r.id === id)!;

  return (
    <div>
      <div role="tablist" aria-label="Select a rival" className="scroll-x -mx-5 flex gap-px px-5 md:mx-0 md:px-0">
        {rivals.map((r) => (
          <button
            key={r.id} role="tab" aria-selected={id === r.id} type="button"
            onClick={() => setId(r.id)}
            className={`shrink-0 border px-5 py-3 text-left transition-colors ${
              id === r.id ? 'border-ink bg-ink text-noir' : 'border-line text-muted hover:text-ink'}`}
          >
            <span className="block font-mono text-[10px] uppercase tracking-[0.16em]">
              {r.teammate ? 'Teammate' : 'Rival'}
            </span>
            <span className="mt-1 block font-display text-lg uppercase">{r.name.split(' ')[1]}</span>
          </button>
        ))}
      </div>

      <motion.div key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="panel mt-6 p-6 md:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="display text-4xl md:text-6xl">Hamilton <span className="text-muted">vs</span> {rival.name}</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {rival.years} · {rival.teammate ? 'Same machinery' : 'Different teams'}
            </p>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-tech">{rival.note}</p>
        </div>

        <div className="mt-10 space-y-6 border-t border-line pt-8">
          {METRICS.map((m) => {
            const a = careerHam[m.key];
            const b = rival[m.key as keyof Rival] as number;
            const max = Math.max(a, b);
            return (
              <div key={m.key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="label">{m.label}</span>
                  <span className="font-mono text-xs text-muted tabular">
                    <span className="text-ink">{a}</span> · <span className="text-ferrari-bright">{b}</span>
                  </span>
                </div>
                <div className="space-y-1">
                  {[{ v: a, c: '#F4F4F4' }, { v: b, c: '#D40000' }].map((row, i) => (
                    <div key={i} className="h-2 w-full bg-line">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(row.v / max) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full" style={{ background: row.c }} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {(rival.h2hQualifying || rival.h2hRace) && (
          <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-2">
            {rival.h2hQualifying && (
              <div>
                <p className="label mb-3">Qualifying head to head</p>
                <SplitBar left={rival.h2hQualifying.hamilton} right={rival.h2hQualifying.rival}
                  leftLabel="Hamilton" rightLabel={rival.name.split(' ')[1]} rightColor="#D40000" />
              </div>
            )}
            {rival.h2hRace && (
              <div>
                <p className="label mb-3">Race head to head</p>
                <SplitBar left={rival.h2hRace.hamilton} right={rival.h2hRace.rival}
                  leftLabel="Hamilton" rightLabel={rival.name.split(' ')[1]} rightColor="#D40000" />
              </div>
            )}
          </div>
        )}

        {!rival.teammate && (
          <p className="mt-8 border-l-2 border-silver-dim pl-4 text-xs leading-relaxed text-muted">
            These drivers never shared a car. Career totals compare two records, not two drivers —
            era, regulations and machinery differ throughout, and the seasons in which both had a
            title-capable car are listed above.
          </p>
        )}

        <SourceBadge className="mt-8" source="Formula1.com career records · rival totals refresh from the results API when connected" />
      </motion.div>
    </div>
  );
}
