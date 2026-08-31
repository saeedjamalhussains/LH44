import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import DataLabClient from '@/components/DataLabClient';
import { LoadingState, Reveal, SectionHeader } from '@/components/ui';
import { iconicLaps } from '@/lib/data';

export const metadata: Metadata = {
  title: 'The Data Lab',
  description:
    'Interactive Formula 1 telemetry: speed, throttle, brake, gear, RPM and lap delta for any session, powered by FastF1. Compare Lewis Hamilton against any rival, lap by lap.',
};

export default function DataLabPage() {
  return (
    <div className="pt-28">
      <header className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeader
          as="h1"
          eyebrow="Interactive telemetry" title="The Data Lab"
          sub="Where the legacy becomes measurable. Select a session, pick a lap, and read the channels the engineers read."
        />
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10">
        <Suspense fallback={<LoadingState label="LOADING SESSION DATA" />}>
          <DataLabClient />
        </Suspense>
      </div>

      <section aria-labelledby="presets" className="border-t border-line bg-surface py-16">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 id="presets" className="display text-4xl md:text-6xl">Start somewhere</h2>
            <p className="mt-3 max-w-2xl text-tech">
              Each of these opens the lab pre-configured for a session worth looking at.
            </p>
          </Reveal>
          <ul className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
            {iconicLaps.slice(0, 8).map((l, i) => (
              <li key={l.id} className="bg-noir">
                <Reveal delay={0.04 * i}>
                  <Link
                    href={`/data-lab?year=${l.year}&gp=${encodeURIComponent(l.gpSlug)}&session=${l.session}&driver=${l.driver}&compare=${l.compare}`}
                    className="group block h-full p-6 transition-colors hover:bg-panel"
                  >
                    <span className="display text-4xl text-ink">{l.year}</span>
                    <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                      {l.gp} · {l.session}
                    </span>
                    <span className="display mt-4 block text-xl">{l.title}</span>
                    <span className="mt-3 block font-mono text-[10px] text-tech group-hover:text-gold">
                      Analyse lap →
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <Link href="/iconic-laps" className="btn btn-ghost mt-10">The laps that mattered →</Link>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line py-16">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 md:grid-cols-3 md:px-10">
          {[
            ['Where the data comes from',
              'Session telemetry is loaded server-side with FastF1, downsampled and cached before it reaches the browser. The raw frames are thousands of rows per lap; what you receive is a few hundred points per channel.'],
            ['What the delta means',
              'The delta is not published timing. It is integrated from each driver’s speed trace along track distance and scaled onto their measured lap time — a calculated metric, labelled as one.'],
            ['When it is unavailable',
              'Telemetry coverage begins in 2018 for full channels. Older sessions, and some practice sessions, return no data. The lab says so rather than filling the gap.'],
          ].map(([t, d]) => (
            <Reveal key={t}>
              <h3 className="display text-2xl">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
